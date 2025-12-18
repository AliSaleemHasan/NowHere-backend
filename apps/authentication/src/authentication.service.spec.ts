
import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationService } from './authentication.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Credential } from './entities/user-credentials-entity';
import { Repository, QueryFailedError } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { USERS_GRPC } from 'nowhere-common';
import { AuthUserRole } from 'proto';

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let repo: Repository<Credential>;
  let jwtService: JwtService;
  let authUsersServiceMock: any;

  const mockUser: Credential = {
    Id: 'user-id',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: 'USER',
    lastLoginAt: new Date(),
    isActive: true, // properties from Credential entity
  } as Credential;

  beforeEach(async () => {
    authUsersServiceMock = {
      CreateUserInfo: jest.fn().mockReturnValue(of({ success: true })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('token'),
            verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-id', user: mockUser }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              if (key === 'ACCESS_SECRET') return 'secret';
              if (key === 'REFRESH_SECRET') return 'secret';
              return 'something';
            }),
          },
        },
        {
          provide: getRepositoryToken(Credential),
          useValue: {
            create: jest.fn().mockImplementation((dto) => dto),
            save: jest.fn().mockResolvedValue(mockUser),
            findOneBy: jest.fn().mockResolvedValue(mockUser),
          },
        },

        {
          provide: 'USERS_GRPC',
          useValue: {
            getService: jest.fn().mockReturnValue(authUsersServiceMock),
          },
        },
      ],
    }).compile();

    service = module.get<AuthenticationService>(AuthenticationService);
    repo = module.get<Repository<Credential>>(getRepositoryToken(Credential));
    jwtService = module.get<JwtService>(JwtService);

    // Manually trigger onModuleInit because we are testing it
    service.onModuleInit();
  });

  describe('signup', () => {
    it('should create user and return tokens', async () => {
      jest.spyOn(bcrypt, 'genSalt').mockImplementation(() => Promise.resolve('salt'));
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashedPassword'));

      const dto = { email: 'test@example.com', password: 'password', role: AuthUserRole.USER };
      const result = await service.signup(dto as any); // cast as any for loose DTO compliance in tests

      expect(result.user).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(repo.save).toHaveBeenCalled();
      expect(authUsersServiceMock.CreateUserInfo).toHaveBeenCalled();
    });

    it('should throw BadRequestException if DB fails', async () => {
      jest.spyOn(service, 'craeteUserCredentials').mockRejectedValue(new Error('DB error'));
      const dto = { email: 'test@example.com', password: 'password', role: AuthUserRole.USER };
      await expect(service.signup(dto as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('should return user and tokens', async () => {
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      const result = await service.login('test@example.com', 'password');
      expect(result.user).toEqual(mockUser);
      expect(result.tokens).toBeDefined();
    });

    it('should throw UnauthorizedException if password wrong', async () => {
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));
      await expect(service.login('test@example.com', 'password')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      repo.findOneBy = jest.fn().mockResolvedValue(null);
      await expect(service.login('test@example.com', 'password')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens', async () => {
      const result = await service.refreshToken('refresh-token');
      expect(result.tokens).toBeDefined();
      expect(jwtService.verifyAsync).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if invalid token', async () => {
      jest.spyOn(jwtService, 'verifyAsync').mockRejectedValue(new Error('Invalid'));
      await expect(service.refreshToken('bad-token')).rejects.toThrow(UnauthorizedException);
    });
  });
});
