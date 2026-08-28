import { Test } from '@nestjs/testing';
import { UsersService } from '../users.service';
import { UsersNatsController } from '../controllers/users.nats.controller';

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
            getAllUsers: jest.fn(),
            getUserSetting: jest.fn(),
            getSeen: jest.fn(),
            addSeen: jest.fn(),
            setUserPhoto: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(UsersNatsController);
    service = module.get(UsersService);
  });

  it('getByEmail returns service result', async () => {
    service.getUserByEmail.mockResolvedValue({ id: 'u1', email: 'a@a.com' } as any);
    const res = await controller.getUserByEmailNats({ email: 'a@a.com' });
    expect(service.getUserByEmail).toHaveBeenCalledWith('a@a.com');
    expect(res).toEqual({ id: 'u1', email: 'a@a.com' });
  });

  it('getUserById returns service result', async () => {
    service.getUserById.mockResolvedValue({ id: 'u1' } as any);
    const res = await controller.getUserByIdNats({ id: 'u1' });
    expect(service.getUserById).toHaveBeenCalledWith('u1');
    expect(res).toEqual({ id: 'u1' });
  });

  it('getAllUsers returns service result', async () => {
    service.getAllUsers.mockResolvedValue([{ id: 'u1' }] as any);
    const res = await controller.getAllUsersInfo();
    expect(res).toEqual({ users: [{ id: 'u1' }] });
  });
});
