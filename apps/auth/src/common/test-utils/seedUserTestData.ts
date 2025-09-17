import { User } from 'apps/auth/src/users/entities/user.entity';
import { Repository } from 'typeorm';
export const seedUserTestData = async (repo: Repository<User>) => {
  //  create multiple users
  let test_users_names = ['Jacob', 'Ellie', 'Lao'];

  for await (const userName of test_users_names) {
    let temp = repo.create({
      bio: 'test',
      email: `${userName}@test.com`,
      firstName: userName,
      lastName: userName,
      password: 'test',
      role: 'USER',
    });
    await repo.save(temp);
  }
};
