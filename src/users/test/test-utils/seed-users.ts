// seed-users.ts
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';

export const seedUserTestData = async (repo: Repository<User>) => {
  const users = new Array(20).fill(null).map((_, index) =>
    repo.create({
      bio: `This is bio for user ${index + 1}`,
      email: `test${index + 1}@test.com`,
      first_name: `test${index + 1}`,
      last_name: `last${index + 1}`,
      isActive: true,
      password: 'Qqqqq1!',
    }),
  );

  await repo.save(users); // persist to DB
};
