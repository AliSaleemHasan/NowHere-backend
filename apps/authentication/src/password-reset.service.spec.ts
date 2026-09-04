import { HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { ProblemCodes, ROLES } from 'contracts';
import { Credential } from './entities/user-credentials-entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { PasswordResetService } from './password-reset.service';
import { SmtpMailer } from './smtp-mailer';
import { hashResetToken } from './token-hash';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
  genSalt: jest.fn(),
}));

describe('PasswordResetService', () => {
  let service: PasswordResetService;
  let credentials: {
    findOneBy: jest.Mock;
    save: jest.Mock;
  };
  let tokens: {
    findOneBy: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    delete: jest.Mock;
  };
  let mailer: { sendPasswordReset: jest.Mock };

  beforeEach(async () => {
    credentials = {
      findOneBy: jest.fn(),
      save: jest.fn(),
    };
    tokens = {
      findOneBy: jest.fn(),
      save: jest.fn(),
      create: jest.fn((row: Partial<PasswordResetToken>) => row),
      delete: jest.fn(),
    };
    mailer = {
      sendPasswordReset: jest.fn().mockResolvedValue(false),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordResetService,
        { provide: getRepositoryToken(Credential), useValue: credentials },
        { provide: getRepositoryToken(PasswordResetToken), useValue: tokens },
        { provide: SmtpMailer, useValue: mailer },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'NODE_ENV') return 'test';
              if (key === 'PASSWORD_RESET_BASE_URL') {
                return 'http://localhost:8081/reset-password';
              }
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get(PasswordResetService);
  });

  it('returns 202-shaped accepted for an unknown email without storing a token', async () => {
    credentials.findOneBy.mockResolvedValue(null);

    const result = await service.forgotPassword({ email: 'missing@a.com' });

    expect(result).toEqual({ accepted: true });
    expect(result).not.toHaveProperty('devResetUrl');
    expect(tokens.save).not.toHaveBeenCalled();
    expect(mailer.sendPasswordReset).not.toHaveBeenCalled();
  });

  it('stores a SHA-256 token hash and returns a non-prod devResetUrl', async () => {
    credentials.findOneBy.mockResolvedValue({
      id: 'u1',
      email: 'a@a.com',
      isActive: true,
    });
    tokens.save.mockResolvedValue({});

    const result = await service.forgotPassword({ email: 'a@a.com' });

    expect(result.accepted).toBe(true);
    expect(result.devResetUrl).toMatch(
      /^http:\/\/localhost:8081\/reset-password\?token=/,
    );
    const raw = new URL(result.devResetUrl as string).searchParams.get(
      'token',
    ) as string;
    expect(tokens.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        tokenHash: hashResetToken(raw),
        usedAt: null,
      }),
    );
    const savedCalls = tokens.save.mock.calls as Array<[{ tokenHash: string }]>;
    expect(savedCalls[0][0].tokenHash).not.toBe(raw);
  });

  it('returns 400 PASSWORD_RESET_INVALID for an expired token', async () => {
    const raw = 'expired-token';
    tokens.findOneBy.mockResolvedValue({
      id: 't1',
      userId: 'u1',
      tokenHash: hashResetToken(raw),
      expiresAt: new Date(Date.now() - 60_000),
      usedAt: null,
    });

    try {
      await service.resetPassword({
        token: raw,
        newPassword: 'Password123!',
      });
      throw new Error('expected resetPassword to reject');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      const exception = err as HttpException;
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(exception.getResponse()).toEqual(
        expect.objectContaining({
          code: ProblemCodes.PASSWORD_RESET_INVALID,
        }),
      );
    }
    expect(credentials.save).not.toHaveBeenCalled();
  });

  it('returns 400 PASSWORD_RESET_INVALID for a used or unknown token', async () => {
    tokens.findOneBy.mockResolvedValue(null);
    await expect(
      service.resetPassword({
        token: 'missing',
        newPassword: 'Password123!',
      }),
    ).rejects.toBeInstanceOf(HttpException);

    tokens.findOneBy.mockResolvedValue({
      id: 't1',
      userId: 'u1',
      tokenHash: hashResetToken('used'),
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: new Date(),
    });
    try {
      await service.resetPassword({
        token: 'used',
        newPassword: 'Password123!',
      });
      throw new Error('expected resetPassword to reject');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getResponse()).toEqual(
        expect.objectContaining({
          code: ProblemCodes.PASSWORD_RESET_INVALID,
        }),
      );
    }
  });

  it('hashes the new password and marks the token used', async () => {
    const raw = 'good-token';
    tokens.findOneBy.mockResolvedValue({
      id: 't1',
      userId: 'u1',
      tokenHash: hashResetToken(raw),
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
    });
    credentials.findOneBy.mockResolvedValue({
      id: 'u1',
      email: 'a@a.com',
      password: 'old-hash',
      isActive: true,
      role: ROLES.USER,
      failedLoginCount: 2,
      lockedUntil: new Date(),
    });
    (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
    (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
    credentials.save.mockResolvedValue({});
    tokens.save.mockResolvedValue({});

    const result = await service.resetPassword({
      token: raw,
      newPassword: 'Password456!',
    });

    expect(result).toEqual({ success: true });
    expect(credentials.save).toHaveBeenCalledWith(
      expect.objectContaining({
        password: 'new-hash',
        failedLoginCount: 0,
        lockedUntil: null,
      }),
    );
    const markedCalls = tokens.save.mock.calls as Array<
      [{ id: string; usedAt: Date }]
    >;
    expect(markedCalls[0][0].id).toBe('t1');
    expect(markedCalls[0][0].usedAt).toBeInstanceOf(Date);
  });
});
