import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';
import { GrpcController } from '../grpc.controller';
import { Settings } from '../../settings/entities/settings.entity';
import { UsersService } from '../../users/users.service';
import { GrpcService } from '../grpc.service';

// 👇 Use fake data helpers
const makeUser = (overrides?: Partial<User>): User =>
  ({
    Id: 'u1',
    email: 'jacob@test.com',
    password: 'hashedpass',
    firstName: 'Jacob',
    lastName: 'test',
    ...overrides,
  }) as User;

describe('GrpcModule (integration)', () => {
  let controller: GrpcController;
  let userRepo: Repository<User>;
  let settingsRepo: Repository<Settings>;
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          synchronize: true,
          entities: [User, Settings],
        }),
        TypeOrmModule.forFeature([User, Settings]),
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
      ],
    }).compile();

    controller = moduleRef.get<GrpcController>(GrpcController);
    userRepo = moduleRef.get<Repository<User>>(getRepositoryToken(User));
    settingsRepo = moduleRef.get<Repository<Settings>>(
      getRepositoryToken(Settings),
    );

    // Seed a test user
    const user = makeUser();
    await userRepo.save(user);

    // Mock bcrypt globally
    jest.spyOn(bcrypt, 'compare').mockImplementation(async (pw, hash) => {
      return pw === 'plaintext' && hash === 'hashedpass';
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('validateUser', () => {
    it('should return user when credentials are correct', async () => {
      const result = await controller.validateUser({
        email: 'jacob@test.com',
        password: 'plaintext',
      });

      expect(result.email).toBe('jacob@test.com');
    });

    it('should throw when password wrong', async () => {
      await expect(
        controller.validateUser({ email: 'jacob@test.com', password: 'wrong' }),
      ).rejects.toThrow();
    });
  });

  describe('validateToken', () => {
    it('should return user from valid token', async () => {
      const mockJwt = moduleRef.get<JwtService>(JwtService);
      (mockJwt.verifyAsync as jest.Mock).mockResolvedValue({
        user: { email: 'jacob@test.com' },
      });

      const result = await controller.validateToken({ token: 'tok' });

      expect(result.email).toBe('jacob@test.com');
    });

    it('should throw when jwt invalid', async () => {
      const mockJwt = moduleRef.get<JwtService>(JwtService);
      (mockJwt.verifyAsync as jest.Mock).mockRejectedValue(
        new Error('bad token'),
      );

      await expect(
        controller.validateToken({ token: 'tok' }),
      ).rejects.toThrow();
    });
  });

  describe('getUserSetting', () => {
    it('should create settings if none exist', async () => {
      const res = await controller.getUserSetting({ id: 'u1' });
      expect(res).toBeDefined();
      expect(await settingsRepo.find()).toHaveLength(1);
    });

    it('should return existing settings without creating new', async () => {
      // pre-create settings
      await settingsRepo.save(
        settingsRepo.create({
          user: { Id: 'u1' } as any,
          maxDistance: 100000,
        }),
      );

      const res = await controller.getUserSetting({ id: 'u1' });
      expect(res).toMatchObject({ maxDistance: 100000 });

      // still only 1 settings in db
      expect(await settingsRepo.find()).toHaveLength(1);
    });
  });
});
