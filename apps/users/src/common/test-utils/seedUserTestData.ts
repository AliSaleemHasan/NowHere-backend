import { User } from '../../users/entities/user.entity';
import { Repository } from 'typeorm';
export const seedUserTestData = async (repo: Repository<User>) => {
  //  create multiple users
  const test_users_names = ['Jacob', 'Ellie', 'Lao'];

  for await (const userName of test_users_names) {
    const temp = repo.create({
      bio: 'test',
      email: `${userName}@test.com`,
      firstName: userName,
      lastName: userName,
    });
    await repo.save(temp);
  }
};
