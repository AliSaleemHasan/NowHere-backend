import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { GrpcController } from '../grpc.controller';
import { Settings } from '../../settings/entities/settings.entity';
import { SnapSeen } from '../../users/entities/snaps-seen.entity';
import { UsersService } from '../../users/users.service';
import { GrpcService } from '../grpc.service';
import { CREDENTIALS_GRPC, STORAGE_GRPC } from 'nowhere-common';

const makeUser = (overrides?: Partial<User>): User =>
  ({
    id: 'u1',
    email: 'jacob@test.com',
    firstName: 'Jacob',
    lastName: 'test',
    bio: '',
    isActive: true,
    ...overrides,
  }) as User;

describe('GrpcModule (integration)', () => {
  let controller: GrpcController;
  let userRepo: Repository<User>;
  let settingsRepo: Repository<Settings>;
  let moduleRef: TestingModule;

  beforeEach(async () => {
    const mockGrpcClient = {
      getService: jest.fn().mockReturnValue({
        validateAuthUser: jest.fn(),
        signup: jest.fn(),
      }),
    };

    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          synchronize: true,
          entities: [User, Settings, SnapSeen],
        }),
        TypeOrmModule.forFeature([User, Settings, SnapSeen]),
      ],
      controllers: [GrpcController],
      providers: [
        GrpcService,
        UsersService,
        {
          provide: JwtService,
          useValue: { verifyAsync: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn(() => 'secret') },
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

    controller = moduleRef.get<GrpcController>(GrpcController);
    userRepo = moduleRef.get<Repository<User>>(getRepositoryToken(User));
    settingsRepo = moduleRef.get<Repository<Settings>>(
      getRepositoryToken(Settings),
    );

    // Seed a test user
    const user = makeUser();
    await userRepo.save(userRepo.create(user));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createUserInfo', () => {
    it('should create user info in db and return proto user', async () => {
      const result = await controller.createUserInfo({
        email: 'alice@test.com',
        firstName: 'Alice',
        lastName: 'Smith',
        bio: 'Hello world',
        authId: 'auth-456',
      });

      expect(result.email).toBe('alice@test.com');
      const savedUser = await userRepo.findOneBy({ email: 'alice@test.com' });
      expect(savedUser).toBeDefined();
      expect(savedUser?.firstName).toBe('Alice');
    });
  });

  describe('getAllUsersInfo', () => {
    it('should return all users in the system', async () => {
      const result = await controller.getAllUsersInfo({});
      expect(result.users).toHaveLength(1);
      expect(result.users[0].email).toBe('jacob@test.com');
    });
  });

  describe('getSettings', () => {
    it('should create settings if none exist', async () => {
      const res = await controller.getSettings({ id: 'u1' });
      expect(res).toBeDefined();
      expect(await settingsRepo.find()).toHaveLength(1);
    });

    it('should return existing settings without creating new', async () => {
      const existingUser = await userRepo.findOneBy({ id: 'u1' });
      await settingsRepo.save(
        settingsRepo.create({
          user: existingUser as User,
          maxDistance: 100000,
        }),
      );

      const res = await controller.getSettings({ id: 'u1' });
      expect(res).toMatchObject({ maxDistance: 100000 });
      expect(await settingsRepo.find()).toHaveLength(1);
    });
  });
});
