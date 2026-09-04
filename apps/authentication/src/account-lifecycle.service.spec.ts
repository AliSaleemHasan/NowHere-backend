import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { ROLES } from 'contracts';
import { AccountLifecycleService } from './account-lifecycle.service';
import { Credential } from './entities/user-credentials-entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
  genSalt: jest.fn(),
}));

describe('AccountLifecycleService', () => {
  let service: AccountLifecycleService;
  let credentials: {
    findOneBy: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };
  let tokens: { delete: jest.Mock };

  beforeEach(async () => {
    credentials = {
      findOneBy: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    tokens = { delete: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountLifecycleService,
        { provide: getRepositoryToken(Credential), useValue: credentials },
        { provide: getRepositoryToken(PasswordResetToken), useValue: tokens },
      ],
    }).compile();

    service = module.get(AccountLifecycleService);
  });

  it('rejects a wrong password with the generic credentials error', async () => {
    credentials.findOneBy.mockResolvedValue({
      id: 'u1',
      password: 'hash',
      isActive: true,
      role: ROLES.USER,
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.deactivateUser({ userId: 'u1', password: 'nope' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(credentials.save).not.toHaveBeenCalled();
  });

  it('sets isActive false when the password matches', async () => {
    credentials.findOneBy.mockResolvedValue({
      id: 'u1',
      password: 'hash',
      isActive: true,
      role: ROLES.USER,
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    credentials.save.mockResolvedValue({});

    await expect(
      service.deactivateUser({ userId: 'u1', password: 'Password123!' }),
    ).resolves.toEqual({ success: true });
    expect(credentials.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'u1', isActive: false }),
    );
  });

  it('is idempotent when the account is already inactive', async () => {
    credentials.findOneBy.mockResolvedValue({
      id: 'u1',
      password: 'hash',
      isActive: false,
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await expect(
      service.deactivateUser({ userId: 'u1', password: 'Password123!' }),
    ).resolves.toEqual({ success: true });
    expect(credentials.save).not.toHaveBeenCalled();
  });

  it('deletes reset tokens then credentials', async () => {
    tokens.delete.mockResolvedValue({});
    credentials.delete.mockResolvedValue({});

    await expect(service.deleteCredentials({ userId: 'u1' })).resolves.toEqual({
      success: true,
    });
    expect(tokens.delete).toHaveBeenCalledWith({ userId: 'u1' });
    expect(credentials.delete).toHaveBeenCalledWith({ id: 'u1' });
  });
});
