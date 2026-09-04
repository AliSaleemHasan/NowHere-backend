import { Test } from '@nestjs/testing';
import { UsersService } from '../users.service';
import { UsersNatsController } from '../controllers/users.nats.controller';
import { BookmarksService } from '../bookmarks.service';
import { ReportsService } from '../reports.service';

describe('UsersNatsController (unit)', () => {
  let controller: UsersNatsController;
  let service: jest.Mocked<UsersService>;

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
            getUserSetting: jest.fn(),
            getSeen: jest.fn(),
            addSeen: jest.fn(),
            setUserPhoto: jest.fn(),
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
          },
        },
      ],
    }).compile();

    controller = module.get(UsersNatsController);
    service = module.get(UsersService);
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
});
