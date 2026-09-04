import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthenticationService } from './authentication.service';
import { Credential } from './entities/user-credentials-entity';
import { JetStreamPublisher } from 'nowhere-common';
import { ProblemCodes, ROLES } from 'contracts';
import { LOGIN_LOCKOUT_DURATION_MS } from './login-lockout';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
  genSalt: jest.fn(),
}));

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let repo: {
    findOneBy: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };
  let jwt: { signAsync: jest.Mock; verifyAsync: jest.Mock };
  let jsPublisher: { publish: jest.Mock };

  beforeEach(async () => {
    repo = {
      findOneBy: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };
    jwt = {
      signAsync: jest.fn().mockResolvedValue('token'),
      verifyAsync: jest.fn(),
    };
    jsPublisher = { publish: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        { provide: getRepositoryToken(Credential), useValue: repo },
        { provide: JwtService, useValue: jwt },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'ACCESS_SECRET') return 'access';
              if (key === 'REFRESH_SECRET') return 'refresh';
              if (key === 'ACCESS_EXP') return '15m';
              if (key === 'REFRESH_EXP') return '7d';
              return undefined;
            }),
          },
        },
        { provide: JetStreamPublisher, useValue: jsPublisher },
      ],
    }).compile();

    service = module.get(AuthenticationService);
    jest.spyOn(service, 'onModuleInit').mockResolvedValue(undefined);
  });

  it('uses the same error for unknown email and wrong password', async () => {
    repo.findOneBy.mockResolvedValue(null);
    await expect(service.login('a@a.com', 'x')).rejects.toThrow(
      'Invalid email or password',
    );

    repo.findOneBy.mockResolvedValue({
      id: 'u1',
      email: 'a@a.com',
      password: 'hash',
      isActive: true,
      role: ROLES.USER,
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    await expect(service.login('a@a.com', 'wrong')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(service.login('a@a.com', 'wrong')).rejects.toThrow(
      'Invalid email or password',
    );
  });

  it('does not create credential rows for unknown emails', async () => {
    repo.findOneBy.mockResolvedValue(null);
    await expect(service.login('missing@a.com', 'x')).rejects.toThrow(
      'Invalid email or password',
    );
    expect(repo.save).not.toHaveBeenCalled();
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('locks after 5 failed logins; the 6th is 423 ACCOUNT_LOCKED even if the password matches', async () => {
    const stored = {
      id: 'u1',
      email: 'a@a.com',
      password: 'hash',
      isActive: true,
      role: ROLES.USER,
      failedLoginCount: 0,
      lockedUntil: null as Date | null,
    };
    repo.findOneBy.mockImplementation(async () => ({ ...stored }));
    repo.save.mockImplementation(async (row) => {
      Object.assign(stored, row);
      return stored;
    });
    (bcrypt.compare as jest.Mock).mockReset();
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    for (let i = 0; i < 5; i++) {
      await expect(service.login('a@a.com', 'wrong')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    }
    expect(stored.failedLoginCount).toBe(5);
    expect(stored.lockedUntil).toBeInstanceOf(Date);
    expect(stored.lockedUntil!.getTime()).toBeGreaterThan(Date.now());
    expect(stored.lockedUntil!.getTime() - Date.now()).toBeLessThanOrEqual(
      LOGIN_LOCKOUT_DURATION_MS,
    );

    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    try {
      await service.login('a@a.com', 'Password123!');
      throw new Error('expected login to reject');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      const exception = err as HttpException;
      expect(exception.getStatus()).toBe(HttpStatus.LOCKED);
      expect(exception.getResponse()).toEqual(
        expect.objectContaining({
          code: ProblemCodes.ACCOUNT_LOCKED,
        }),
      );
    }
    expect(bcrypt.compare).toHaveBeenCalledTimes(5);
  });

  it('resets the failure counter on a successful login', async () => {
    repo.findOneBy.mockResolvedValue({
      id: 'u1',
      email: 'a@a.com',
      password: 'hash',
      isActive: true,
      role: ROLES.USER,
      failedLoginCount: 3,
      lockedUntil: null,
    });
    repo.save.mockImplementation(async (row) => row);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await service.login('a@a.com', 'Password123!');

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        failedLoginCount: 0,
        lockedUntil: null,
      }),
    );
  });

  it('rejects disabled accounts', async () => {
    repo.findOneBy.mockResolvedValue({
      id: 'u1',
      email: 'a@a.com',
      password: 'hash',
      isActive: false,
      role: ROLES.USER,
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    await expect(
      service.login('a@a.com', 'Password123!'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('signup always persists USER and ignores a smuggled role', async () => {
    (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
    repo.create.mockImplementation((dto) => dto);
    repo.save.mockResolvedValue({
      id: 'new',
      email: 'n@n.com',
      role: ROLES.USER,
      isActive: true,
    });

    await service.signup({
      email: 'n@n.com',
      password: 'Password123!',
      firstName: 'N',
      lastName: 'N',
      role: ROLES.ADMIN,
    } as any);

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: ROLES.USER, email: 'n@n.com' }),
    );
  });

  it('refresh reloads the user from the database', async () => {
    jwt.verifyAsync.mockResolvedValue({
      sub: 'u1',
      user: { id: 'u1', role: ROLES.ADMIN, email: 'stale@old.com' },
    });
    repo.findOneBy.mockResolvedValue({
      id: 'u1',
      email: 'fresh@new.com',
      role: ROLES.USER,
      isActive: true,
    });

    const result = await service.refreshToken('refresh-token');
    expect(repo.findOneBy).toHaveBeenCalledWith({ id: 'u1' });
    expect(result.user.email).toBe('fresh@new.com');
    expect(result.user.role).toBe(ROLES.USER);
  });

  it('maps duplicate email to conflict', async () => {
    (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
    repo.create.mockImplementation((dto) => dto);
    const dup = Object.assign(new Error('dup'), {
      driverError: { code: 'ER_DUP_ENTRY', errno: 1062 },
    });
    repo.save.mockRejectedValue(dup);

    await expect(
      service.signup({
        email: 'n@n.com',
        password: 'Password123!',
        firstName: 'N',
        lastName: 'N',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
