import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { ROLES } from 'contracts';
import { ChangePasswordService } from './change-password.service';
import { Credential } from './entities/user-credentials-entity';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
  genSalt: jest.fn(),
}));

describe('ChangePasswordService', () => {
  let service: ChangePasswordService;
  let repo: {
    findOneBy: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      findOneBy: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChangePasswordService,
        { provide: getRepositoryToken(Credential), useValue: repo },
      ],
    }).compile();

    service = module.get(ChangePasswordService);
  });

  it('returns 401 with the generic credentials error when the current password is wrong', async () => {
    repo.findOneBy.mockResolvedValue({
      id: 'u1',
      email: 'a@a.com',
      password: 'hash',
      isActive: true,
      role: ROLES.USER,
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.changePassword({
        userId: 'u1',
        currentPassword: 'wrong',
        newPassword: 'Password456!',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      service.changePassword({
        userId: 'u1',
        currentPassword: 'wrong',
        newPassword: 'Password456!',
      }),
    ).rejects.toThrow('Invalid email or password');
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('hashes and stores the new password when the current one matches', async () => {
    repo.findOneBy.mockResolvedValue({
      id: 'u1',
      email: 'a@a.com',
      password: 'hash',
      isActive: true,
      role: ROLES.USER,
      failedLoginCount: 2,
      lockedUntil: new Date(),
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
    (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
    repo.save.mockResolvedValue({});

    const result = await service.changePassword({
      userId: 'u1',
      currentPassword: 'Password123!',
      newPassword: 'Password456!',
    });

    expect(bcrypt.hash).toHaveBeenCalledWith('Password456!', 'salt');
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        password: 'new-hash',
        failedLoginCount: 0,
        lockedUntil: null,
      }),
    );
    expect(result).toEqual({ success: true });
  });
});
