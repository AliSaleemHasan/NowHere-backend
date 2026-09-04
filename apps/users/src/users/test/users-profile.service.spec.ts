import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UsersProfileService } from '../users-profile.service';

describe('UsersProfileService (unit)', () => {
  let service: UsersProfileService;
  let userRepo: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersProfileService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UsersProfileService);
    userRepo = module.get(getRepositoryToken(User));
  });

  it('patches firstName, lastName, and bio on the existing user', async () => {
    const user = {
      id: 'u1',
      email: 'a@a.com',
      firstName: 'Old',
      lastName: 'Name',
      bio: 'before',
    } as User;
    userRepo.findOne.mockResolvedValue(user);
    userRepo.save.mockImplementation(async (row) => row as User);

    const result = await service.updateProfile({
      userId: 'u1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      bio: 'notes',
    });

    expect(userRepo.findOne).toHaveBeenCalledWith({ where: { id: 'u1' } });
    expect(result).toEqual(
      expect.objectContaining({
        id: 'u1',
        email: 'a@a.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
        bio: 'notes',
      }),
    );
    expect(userRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'a@a.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
        bio: 'notes',
      }),
    );
  });

  it('throws NotFoundException when the user is missing', async () => {
    userRepo.findOne.mockResolvedValue(null);
    await expect(
      service.updateProfile({ userId: 'missing', firstName: 'Ada' }),
    ).rejects.toThrow(NotFoundException);
    expect(userRepo.save).not.toHaveBeenCalled();
  });
});
