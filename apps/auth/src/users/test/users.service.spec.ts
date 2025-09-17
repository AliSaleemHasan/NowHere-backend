// tests/unit/users.service.spec.ts
import { Test } from '@nestjs/testing';
import { UsersService } from '../users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';

describe('UsersService (unit)', () => {
  let service: UsersService;
  let repo: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UsersService);
    repo = module.get(getRepositoryToken(User));
  });

  it('createUser creates and saves a user', async () => {
    const dto = {
      email: 'a@a.com',
      password: 'Qqqqqq1!',
      firstName: 'A',
      lastName: 'B',
      bio: null,
    } as any;
    const entity = { Id: 'uuid', ...dto } as User;

    repo.create.mockReturnValue(entity);
    repo.save.mockResolvedValue(entity);

    const result = await service.createUser(dto);
    expect(repo.create).toHaveBeenCalledWith(dto);
    expect(repo.save).toHaveBeenCalledWith(entity);
    expect(result).toEqual(entity);
  });

  it('getUserById returns user without password', async () => {
    const user = {
      Id: 'u1',
      email: 'a@a.com',
      password: 'secret',
      firstName: 'A',
      lastName: 'B',
      bio: '',
      isActive: false,
    } as User;
    repo.findOne.mockResolvedValue(user);

    const result = await service.getUserById('u1');
    expect(repo.findOne).toHaveBeenCalledWith({ where: { Id: 'u1' } });
    expect(result).toEqual({
      Id: 'u1',
      email: 'a@a.com',
      firstName: 'A',
      lastName: 'B',
      bio: '',
      isActive: false, // if absent in mock
    });
    expect((result as any).password).toBeUndefined();
  });

  it('getUserById returns message when not found', async () => {
    repo.findOne.mockResolvedValue(null);
    const result = await service.getUserById('missing');
    expect(result).toBe('User not found!');
  });

  it('getUserByEmail returns user or null', async () => {
    repo.findOne.mockResolvedValueOnce({ Id: 'u1' } as any);
    const found = await service.getUserByEmail('a@a.com');
    expect(repo.findOne).toHaveBeenCalledWith({ where: { email: 'a@a.com' } });
    expect(found).toEqual({ Id: 'u1' });

    repo.findOne.mockResolvedValueOnce(null);
    const notFound = await service.getUserByEmail('b@b.com');
    expect(notFound).toBeNull();
  });

  it('getAllUsers returns array', async () => {
    repo.find.mockResolvedValue([{ Id: 'u1' }] as any);
    const all = await service.getAllUsers();
    expect(all).toEqual([{ Id: 'u1' }]);
  });
});
