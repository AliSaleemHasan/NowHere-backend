import { Test } from '@nestjs/testing';
import { UsersSettingsService } from '../../settings/users-settings.service';
import { UsersNatsController } from '../controllers/users.nats.controller';
import { UsersProfileService } from '../users-profile.service';
import { UsersService } from '../users.service';
import { BookmarksService } from '../bookmarks.service';
import { ReportsService } from '../reports.service';
import { UsersExportService } from '../users-export.service';
import { UsersPurgeService } from '../users-purge.service';

describe('UsersNatsController (unit)', () => {
  let controller: UsersNatsController;
  let service: jest.Mocked<UsersService>;
  let profile: jest.Mocked<UsersProfileService>;
  let settings: jest.Mocked<UsersSettingsService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UsersNatsController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            getUserByEmail: jest.fn(),
            getUserById: jest.fn(),
            getUserWithImage: jest.fn(),
            getAllUsers: jest.fn(),
            getSeen: jest.fn(),
            addSeen: jest.fn(),
            setUserPhoto: jest.fn(),
          },
        },
        {
          provide: UsersProfileService,
          useValue: { updateProfile: jest.fn() },
        },
        {
          provide: UsersSettingsService,
          useValue: {
            getUserSetting: jest.fn(),
            updateSettings: jest.fn(),
          },
        },
        {
          provide: BookmarksService,
          useValue: {
            addBookmark: jest.fn(),
            removeBookmark: jest.fn(),
            listBookmarks: jest.fn(),
          },
        },
        {
          provide: ReportsService,
          useValue: {
            createReport: jest.fn(),
            listByUser: jest.fn(),
          },
        },
        {
          provide: UsersExportService,
          useValue: { exportUser: jest.fn() },
        },
        {
          provide: UsersPurgeService,
          useValue: { purgeUser: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get(UsersNatsController);
    service = module.get(UsersService);
    profile = module.get(UsersProfileService);
    settings = module.get(UsersSettingsService);
  });

  it('getByEmail returns service result', async () => {
    service.getUserByEmail.mockResolvedValue({
      id: 'u1',
      email: 'a@a.com',
    } as any);
    const res = await controller.getUserByEmailNats({ email: 'a@a.com' });
    expect(service.getUserByEmail).toHaveBeenCalledWith('a@a.com');
    expect(res).toEqual({ id: 'u1', email: 'a@a.com' });
  });

  it('getUserById returns user with image', async () => {
    service.getUserWithImage.mockResolvedValue({
      user: { id: 'u1' },
      userImage: 'https://signed',
    } as any);
    const res = await controller.getUserByIdNats({ id: 'u1' });
    expect(service.getUserWithImage).toHaveBeenCalledWith('u1');
    expect(res).toEqual({ user: { id: 'u1' }, userImage: 'https://signed' });
  });

  it('getAllUsers returns service result', async () => {
    service.getAllUsers.mockResolvedValue([{ id: 'u1' }] as any);
    const res = await controller.getAllUsersInfo();
    expect(res).toEqual({ users: [{ id: 'u1' }] });
  });

  it('updateProfile delegates after validation', async () => {
    profile.updateProfile.mockResolvedValue({
      id: 'u1',
      firstName: 'Ada',
    } as any);
    const res = await controller.updateProfile({
      userId: 'u1',
      firstName: 'Ada',
    });
    expect(profile.updateProfile).toHaveBeenCalledWith({
      userId: 'u1',
      firstName: 'Ada',
    });
    expect(res).toEqual({ id: 'u1', firstName: 'Ada' });
  });

  it('setUserPhoto rejects a payload without a key', async () => {
    await expect(
      controller.setUserPhoto({ userId: 'u1' } as any),
    ).rejects.toThrow();
    expect(service.setUserPhoto).not.toHaveBeenCalled();
  });

  it('setUserPhoto validates the key payload then delegates', async () => {
    service.setUserPhoto.mockResolvedValue({
      user: { id: 'u1' },
      userImage: 'https://signed',
    } as any);
    const res = await controller.setUserPhoto({
      userId: 'u1',
      key: 'profile/u1/a.jpg',
    });
    expect(service.setUserPhoto).toHaveBeenCalledWith({
      userId: 'u1',
      key: 'profile/u1/a.jpg',
    });
    expect(res).toEqual({ user: { id: 'u1' }, userImage: 'https://signed' });
  });

  it('updateSettings rejects out-of-enum values', async () => {
    await expect(
      controller.updateSettings({
        userId: 'u1',
        maxDistance: 123,
        newSnapDistance: 250,
        snapDisappearTime: 1,
      }),
    ).rejects.toThrow();
    expect(settings.updateSettings).not.toHaveBeenCalled();
  });
});
