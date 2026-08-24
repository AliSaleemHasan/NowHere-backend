import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { JwtGuard, MockJwtGuard } from 'nowhere-common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { seedUserTestData } from '../../common/test-utils/seedUserTestData';

import { SnapSeen } from '../entities/snaps-seen.entity';
import { Settings } from '../../settings/entities/settings.entity';
import { CREDENTIALS_GRPC, STORAGE_GRPC, RoleGuard } from 'nowhere-common';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('UserController (integration)', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const mockGrpcClient = {
      getService: jest.fn().mockReturnValue({
        validateAuthUser: jest.fn(),
        signup: jest.fn(),
      }),
    };

    const module = await Test.createTestingModule({
      controllers: [UsersController],
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          entities: [User, Settings, SnapSeen],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([User, Settings, SnapSeen]),
      ],
      providers: [
        UsersService,
        { provide: JwtService, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: STORAGE_GRPC, useValue: mockGrpcClient },
        { provide: CREDENTIALS_GRPC, useValue: mockGrpcClient },
      ],
    })
      .overrideGuard(JwtGuard)
      .useClass(MockJwtGuard)
      .overrideGuard(RoleGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);

    const userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    await seedUserTestData(userRepo);
  });

  describe('GetByEmail', () => {
    it('Should return the user when found', async () => {
      const user = await controller.getByEmail('Jacob@test.com');
      expect(user?.email).toBe('Jacob@test.com');
    });

    it('Should throw NotFoundException when not found ', async () => {
      await expect(controller.getByEmail('tes@test.com')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAllUsers', () => {
    it('Should get a list of 3 users with right emails ', async () => {
      const users = await controller.getAllUsers();
      expect(users).toHaveLength(3);

      users.forEach((user) => {
        expect(user.email).toBe(`${user.firstName}@test.com`);
      });
    });
  });
});
