import { Test } from '@nestjs/testing';
import { UsersService } from '../users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { SnapSeen } from '../entities/snaps-seen.entity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { StoragePatterns } from 'contracts';
import { NATS_CLIENT } from 'nowhere-common';
import { of } from 'rxjs';

describe('UsersService (unit)', () => {
  let service: UsersService;
  let userRepo: jest.Mocked<Repository<User>>;
  let snapSeenRepo: jest.Mocked<Repository<SnapSeen>>;
  let send: jest.Mock;

  beforeEach(async () => {
    send = jest.fn().mockReturnValue(of({}));
    const module = await Test.createTestingModule({
      providers: [
        {
          provide: NATS_CLIENT,
          useValue: { send, emit: jest.fn() },
        },
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
        {
          provide: getRepositoryToken(SnapSeen),
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
    userRepo = module.get(getRepositoryToken(User));
    snapSeenRepo = module.get(getRepositoryToken(SnapSeen));
  });

  it('createUser creates and saves a user', async () => {
    const dto = {
      email: 'a@a.com',
      firstName: 'A',
      lastName: 'B',
      bio: '',
      authId: 'auth-1',
    } as any;
    const entity = { id: 'uuid', ...dto } as User;

    userRepo.create.mockReturnValue(entity);
    userRepo.save.mockResolvedValue(entity);

    userRepo.findOne.mockResolvedValue(null);
    const result = await service.createUser(dto);
    expect(userRepo.create).toHaveBeenCalledWith({
      ...dto,
      id: dto.id || dto.authId,
    });
    expect(userRepo.save).toHaveBeenCalledWith(entity);
    expect(result).toEqual(entity);
  });

  it('getUserById returns user', async () => {
    const user = {
      id: 'u1',
      email: 'a@a.com',
      firstName: 'A',
      lastName: 'B',
      bio: '',
      image: '',
    } as User;
    userRepo.findOne.mockResolvedValue(user);

    const result = await service.getUserById('u1');
    expect(userRepo.findOne).toHaveBeenCalledWith({ where: { id: 'u1' } });
    expect(result).toEqual(user);
  });

  it('getUserById throws NotFoundException when not found', async () => {
    userRepo.findOne.mockResolvedValue(null);
    await expect(service.getUserById('missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('getUserByEmail returns user when found', async () => {
    const user = { id: 'u1', email: 'a@a.com' } as User;
    userRepo.findOne.mockResolvedValue(user);
    const found = await service.getUserByEmail('a@a.com');
    expect(userRepo.findOne).toHaveBeenCalledWith({
      where: { email: 'a@a.com' },
    });
    expect(found).toEqual(user);
  });

  it('getUserByEmail throws NotFoundException when not found', async () => {
    userRepo.findOne.mockResolvedValue(null);
    await expect(service.getUserByEmail('b@b.com')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('getAllUsers returns array', async () => {
    userRepo.find.mockResolvedValue([{ id: 'u1' }] as any);
    const all = await service.getAllUsers();
    expect(all).toEqual([{ id: 'u1' }]);
  });

  it('getSeen always queries this user snap_seen rows', async () => {
    snapSeenRepo.find.mockResolvedValue([]);
    await service.getSeen({
      seen: false,
      userId: 'caller',
      snapIds: ['s1', 's2'],
    });
    expect(snapSeenRepo.find).toHaveBeenCalledWith({
      where: { userId: 'caller', snapId: expect.anything() },
    });
    const arg = snapSeenRepo.find.mock.calls[0][0] as {
      where: { userId: string };
    };
    expect(arg.where.userId).toBe('caller');
  });

  it('createUser is idempotent on authId', async () => {
    const existing = { id: 'auth-1', email: 'a@a.com' } as User;
    userRepo.findOne.mockResolvedValue(existing);
    const result = await service.createUser({
      authId: 'auth-1',
      email: 'a@a.com',
      firstName: 'A',
      lastName: 'B',
    } as any);
    expect(result).toEqual(existing);
    expect(userRepo.save).not.toHaveBeenCalled();
  });

  it('setUserPhoto stores an owned profile key and returns a signed url', async () => {
    const user = {
      id: 'u1',
      email: 'a@a.com',
      image: 'profile/u1/old.jpg',
    } as User;
    userRepo.findOne.mockResolvedValue(user);
    userRepo.save.mockImplementation(async (row) => row as User);
    send.mockImplementation((pattern: string) => {
      if (pattern === StoragePatterns.GET_SIGNED_URL) {
        return of({ signed: 'https://signed/profile' });
      }
      if (pattern === StoragePatterns.DELETE_FILES) {
        return of(undefined);
      }
      return of({});
    });

    const result = await service.setUserPhoto({
      userId: 'u1',
      key: 'profile/u1/new.jpg',
    });

    expect(result.user.image).toBe('profile/u1/new.jpg');
    expect(result.userImage).toBe('https://signed/profile');
    expect(send).toHaveBeenCalledWith(StoragePatterns.DELETE_FILES, {
      keys: ['profile/u1/old.jpg'],
    });
    expect(send).toHaveBeenCalledWith(StoragePatterns.GET_SIGNED_URL, {
      key: 'profile/u1/new.jpg',
    });
  });

  it('rejects a snap key as a profile photo', async () => {
    await expect(
      service.setUserPhoto({
        userId: 'u1',
        key: 'snaps/2026-09-03/u1/a.jpg',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(userRepo.save).not.toHaveBeenCalled();
  });
});
