import { Test } from '@nestjs/testing';
import { of } from 'rxjs';
import { SnapsPatterns, StoragePatterns } from 'contracts';
import { NATS_CLIENT } from 'nowhere-common';
import { UsersExportService } from './users-export.service';
import { UsersService } from './users.service';
import { UsersSettingsService } from '../settings/users-settings.service';
import { BookmarksService } from './bookmarks.service';
import { ReportsService } from './reports.service';
import { User } from './entities/user.entity';

describe('UsersExportService', () => {
  let service: UsersExportService;
  let natsClient: { send: jest.Mock };
  let usersService: {
    getUserById: jest.Mock;
    getSeen: jest.Mock;
  };
  let settings: { getUserSetting: jest.Mock };
  let bookmarks: { listBookmarks: jest.Mock };
  let reports: { listByUser: jest.Mock };

  const user = {
    id: 'u1',
    email: 'a@a.com',
    firstName: 'Ada',
    lastName: 'Lovelace',
    bio: 'notes',
    image: 'avatars/u1.jpg',
  } as User;

  const settingsRow = {
    id: 'set-1',
    maxDistance: 5000,
    newSnapDistance: 500,
    snapDisappearTime: 3,
  };

  beforeEach(async () => {
    natsClient = {
      send: jest.fn().mockReturnValue(
        of([
          {
            id: 's1',
            _userId: 'u1',
            description: 'hello',
            snaps: ['snaps/2026-09-03/u1/a.jpg'],
          },
        ]),
      ),
    };
    usersService = {
      getUserById: jest.fn().mockResolvedValue(user),
      getSeen: jest
        .fn()
        .mockResolvedValue([
          { snapId: 's1', userId: 'u1', seenAt: new Date('2026-09-01') },
        ]),
    };
    settings = {
      getUserSetting: jest.fn().mockResolvedValue(settingsRow),
    };
    bookmarks = {
      listBookmarks: jest
        .fn()
        .mockResolvedValue([
          { userId: 'u1', snapId: 's1', createdAt: new Date('2026-09-01') },
        ]),
    };
    reports = {
      listByUser: jest.fn().mockResolvedValue([
        {
          userId: 'u1',
          snapId: 's2',
          reason: 'spam',
          createdAt: new Date('2026-09-01'),
        },
      ]),
    };

    const module = await Test.createTestingModule({
      providers: [
        UsersExportService,
        { provide: UsersService, useValue: usersService },
        { provide: UsersSettingsService, useValue: settings },
        { provide: BookmarksService, useValue: bookmarks },
        { provide: ReportsService, useValue: reports },
        { provide: NATS_CLIENT, useValue: natsClient },
      ],
    }).compile();

    service = module.get(UsersExportService);
  });

  it('exports snaps and settings with object keys, not signed URLs', async () => {
    const result = await service.exportUser({ userId: 'u1' });

    expect(result.exportedAt).toEqual(expect.any(String));
    expect(result.user).toEqual(
      expect.objectContaining({
        id: 'u1',
        email: 'a@a.com',
        image: 'avatars/u1.jpg',
      }),
    );
    expect(result.settings).toEqual(settingsRow);
    expect(result.snaps).toEqual([
      expect.objectContaining({
        id: 's1',
        snaps: ['snaps/2026-09-03/u1/a.jpg'],
      }),
    ]);
    expect(result.seen[0].snapId).toBe('s1');
    expect(result.bookmarks[0].snapId).toBe('s1');
    expect(result.reports[0].reason).toBe('spam');

    const json = JSON.stringify(result);
    expect(json).not.toMatch(/https?:\/\//);
    expect(json).toContain('snaps/2026-09-03/u1/a.jpg');
    expect(json).toContain('avatars/u1.jpg');

    expect(natsClient.send).toHaveBeenCalledWith(SnapsPatterns.FIND_BY_USER, {
      userId: 'u1',
      includeExpired: true,
    });
    expect(
      natsClient.send.mock.calls.some(
        ([pattern]) => pattern === StoragePatterns.GET_SIGNED_URL,
      ),
    ).toBe(false);
    expect(
      natsClient.send.mock.calls.some(
        ([pattern]) => pattern === StoragePatterns.GET_SIGNED_URLS,
      ),
    ).toBe(false);
  });
});
