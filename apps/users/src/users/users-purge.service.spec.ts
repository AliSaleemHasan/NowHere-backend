import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { of } from 'rxjs';
import { StoragePatterns } from 'contracts';
import { NATS_CLIENT } from 'nowhere-common';
import { UsersPurgeService } from './users-purge.service';
import { User } from './entities/user.entity';
import { Settings } from '../settings/entities/settings.entity';
import { SnapSeen } from './entities/snaps-seen.entity';
import { SnapBookmark } from './entities/snap-bookmark.entity';
import { SnapReport } from './entities/snap-report.entity';

describe('UsersPurgeService', () => {
  let service: UsersPurgeService;
  let userRepo: {
    findOne: jest.Mock;
    remove: jest.Mock;
  };
  let settingsRepo: { findOne: jest.Mock; remove: jest.Mock };
  let seenRepo: { delete: jest.Mock };
  let bookmarkRepo: { delete: jest.Mock };
  let reportRepo: { delete: jest.Mock };
  let natsClient: { send: jest.Mock };

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'u1',
        image: 'avatars/u1.jpg',
      }),
      remove: jest.fn(),
    };
    settingsRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'set-1' }),
      remove: jest.fn(),
    };
    seenRepo = { delete: jest.fn() };
    bookmarkRepo = { delete: jest.fn() };
    reportRepo = { delete: jest.fn() };
    natsClient = { send: jest.fn().mockReturnValue(of(undefined)) };

    const module = await Test.createTestingModule({
      providers: [
        UsersPurgeService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Settings), useValue: settingsRepo },
        { provide: getRepositoryToken(SnapSeen), useValue: seenRepo },
        { provide: getRepositoryToken(SnapBookmark), useValue: bookmarkRepo },
        { provide: getRepositoryToken(SnapReport), useValue: reportRepo },
        { provide: NATS_CLIENT, useValue: natsClient },
      ],
    }).compile();

    service = module.get(UsersPurgeService);
  });

  it('deletes the avatar key then profile rows', async () => {
    await expect(service.purgeUser({ userId: 'u1' })).resolves.toEqual({
      success: true,
    });

    expect(natsClient.send).toHaveBeenCalledWith(StoragePatterns.DELETE_FILES, {
      keys: ['avatars/u1.jpg'],
    });
    expect(seenRepo.delete).toHaveBeenCalledWith({ userId: 'u1' });
    expect(bookmarkRepo.delete).toHaveBeenCalledWith({ userId: 'u1' });
    expect(reportRepo.delete).toHaveBeenCalledWith({ userId: 'u1' });
    expect(settingsRepo.remove).toHaveBeenCalled();
    expect(userRepo.remove).toHaveBeenCalled();
  });

  it('is idempotent when the user is already gone', async () => {
    userRepo.findOne.mockResolvedValue(null);
    settingsRepo.findOne.mockResolvedValue(null);

    await expect(service.purgeUser({ userId: 'u1' })).resolves.toEqual({
      success: true,
    });
    expect(natsClient.send).not.toHaveBeenCalled();
    expect(userRepo.remove).not.toHaveBeenCalled();
    expect(seenRepo.delete).toHaveBeenCalledWith({ userId: 'u1' });
  });
});
