// tests/unit/users.controller.spec.ts
import { Test } from '@nestjs/testing';
import { UsersService } from '../users.service';
import { UsersController } from '../users.controller';
import { JwtGuard, MockJwtGuard } from 'nowhere-common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

describe('UsersController (unit)', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            getUserByEmail: jest.fn(),
            getUserById: jest.fn(),
            getAllUsers: jest.fn(),
          },
        },
        { provide: JwtService, useValue: {} },
        { provide: ConfigService, useValue: {} },
      ],
    })
      .overrideGuard(JwtGuard)
      .useClass(MockJwtGuard)
      .compile();

    controller = module.get(UsersController);
    service = module.get(UsersService);
  });

  it('getByEmail returns service result', async () => {
    service.getUserByEmail.mockResolvedValue({
      Id: 'u1',
      email: 'a@a.com',
    } as any);
    const res = await controller.getByEmail('a@a.com');
    expect(service.getUserByEmail).toHaveBeenCalledWith('a@a.com');
    expect(res).toEqual({ Id: 'u1', email: 'a@a.com' });
  });

  it('getUserById returns service result', async () => {
    service.getUserById.mockResolvedValue({ Id: 'u1' } as any);
    const res = await controller.getUserById('u1');
    expect(service.getUserById).toHaveBeenCalledWith('u1');
    expect(res).toEqual({ Id: 'u1' });
  });

  it('getAllUsers returns service result', async () => {
    service.getAllUsers.mockResolvedValue([{ Id: 'u1' }] as any);
    const res = await controller.getAllUsers();
    expect(res).toEqual([{ Id: 'u1' }]);
  });
});
