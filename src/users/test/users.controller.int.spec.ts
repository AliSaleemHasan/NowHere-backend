import { Test } from '@nestjs/testing';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { seedUserTestData } from './test-utils/seed-users';
import { Repository } from 'typeorm';

describe('UserController (integration)', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          dropSchema: true,
          entities: [User],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([User]),
      ],
      providers: [UsersService],
    }).compile();

    controller = module.get<UsersController>(UsersController);

    const userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    await seedUserTestData(userRepo);
  });

  describe('GetByEmail', () => {
    it('Should return the user when found', async () => {
      const user = await controller.getByEmail('test1@test.com');
      expect(user?.email).toBe('test1@test.com');
    });

    it('Should return null when not found ', async () => {
      const user = await controller.getByEmail('tes@test.com');
      expect(user).toBeNull();
    });
  });

  describe('getAllUsers', () => {
    it('Should get a list of 20 users with right emails ', async () => {
      const users = await controller.getAllUsers();
      expect(users).toHaveLength(20);

      users.forEach((user) => {
        expect(user.email).toBe(`${user.first_name}@test.com`);
      });
    });
  });
});
