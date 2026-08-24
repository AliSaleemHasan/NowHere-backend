import { Test } from '@nestjs/testing';
import { UsersService } from '../users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { SnapSeen } from '../entities/snaps-seen.entity';
import { Settings } from '../../settings/entities/settings.entity';
import { ConfigService } from '@nestjs/config';
import { CREDENTIALS_GRPC, STORAGE_GRPC } from 'nowhere-common';
import { NotFoundException } from '@nestjs/common';

describe('UsersService (unit)', () => {
  let service: UsersService;
  let userRepo: jest.Mocked<Repository<User>>;
  let snapSeenRepo: jest.Mocked<Repository<SnapSeen>>;
  let settingsRepo: jest.Mocked<Repository<Settings>>;

  beforeEach(async () => {
    const mockGrpcClient = {
      getService: jest.fn().mockReturnValue({
        validateAuthUser: jest.fn(),
        signup: jest.fn(),
        getSignedUrl: jest.fn(),
        uploadPhoto: jest.fn(),
      }),
    };

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
        {
          provide: getRepositoryToken(SnapSeen),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Settings),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
        {
          provide: STORAGE_GRPC,
          useValue: mockGrpcClient,
        },
        {
          provide: CREDENTIALS_GRPC,
          useValue: mockGrpcClient,
        },
      ],
    }).compile();

    service = module.get(UsersService);
    userRepo = module.get(getRepositoryToken(User));
    snapSeenRepo = module.get(getRepositoryToken(SnapSeen));
    settingsRepo = module.get(getRepositoryToken(Settings));
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

    const result = await service.createUser(dto);
    expect(userRepo.create).toHaveBeenCalledWith(dto);
    expect(userRepo.save).toHaveBeenCalledWith(entity);
    expect(result).toEqual(entity);
  });

  it('getUserById returns user and userImage', async () => {
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
    expect(result).toEqual({
      user,
      userImage: '',
    });
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
    expect(userRepo.findOne).toHaveBeenCalledWith({ where: { email: 'a@a.com' } });
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
});
