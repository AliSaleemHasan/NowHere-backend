import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Settings } from './entities/settings.entity';
import { UsersSettingsService } from './users-settings.service';

describe('UsersSettingsService (unit)', () => {
  let service: UsersSettingsService;
  let settingsRepo: jest.Mocked<Repository<Settings>>;
  let userRepo: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersSettingsService,
        {
          provide: getRepositoryToken(Settings),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UsersSettingsService);
    settingsRepo = module.get(getRepositoryToken(Settings));
    userRepo = module.get(getRepositoryToken(User));
  });

  it('replaces the preset triple and omits the user relation', async () => {
    const existing = {
      id: 's1',
      user: { id: 'u1' },
      maxDistance: 10000,
      newSnapDistance: 1000,
      snapDisappearTime: 1,
    } as Settings;
    settingsRepo.findOne.mockResolvedValue(existing);
    settingsRepo.save.mockImplementation(async (row) => row as Settings);

    const result = await service.updateSettings({
      userId: 'u1',
      maxDistance: 5000,
      newSnapDistance: 500,
      snapDisappearTime: 3,
    });

    expect(settingsRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        maxDistance: 5000,
        newSnapDistance: 500,
        snapDisappearTime: 3,
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        maxDistance: 5000,
        newSnapDistance: 500,
        snapDisappearTime: 3,
      }),
    );
    expect(result).not.toHaveProperty('user');
  });

  it('404s when creating settings for a missing user', async () => {
    settingsRepo.findOne.mockResolvedValue(null);
    userRepo.findOne.mockResolvedValue(null);
    await expect(
      service.updateSettings({
        userId: 'missing',
        maxDistance: 1000,
        newSnapDistance: 250,
        snapDisappearTime: 1,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
