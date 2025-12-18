import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AuthenticationModule } from './../src/authentication.module';
import { QueryFailedError, Repository, DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Credential } from './../src/entities/user-credentials-entity';
import { USERS_GRPC } from 'nowhere-common';
import { of } from 'rxjs';

describe('AuthenticationController (e2e)', () => {
  let app: INestApplication;
  let repoMock: any;

  beforeEach(async () => {
    repoMock = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((user) => Promise.resolve({ ...user, Id: 'e2e-id' })),
      findOneBy: jest.fn().mockImplementation(({ email }) => {
        if (email === 'e2e@example.com') {
          return Promise.resolve({
            Id: 'e2e-id',
            email,
            password: '$2b$10$hashedpassword', // mock bcrypt hash
            role: 'USER'
          });
        }
        return null;
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthenticationModule],
    })
      .overrideProvider(getRepositoryToken(Credential))
      .useValue(repoMock)
      .overrideProvider(USERS_GRPC)
      .useValue({
        getService: jest.fn().mockReturnValue({
          CreateUserInfo: jest.fn().mockReturnValue(of({ success: true }))
        })
      })
      .overrideProvider(DataSource)
      .useValue({
        createEntityManager: jest.fn(),
        hasMetadata: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const newUser = {
    email: 'new@example.com',
    password: 'Password123!',
    role: 1
  };

  it('/auth/signup (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/signup')
      .send({ user: newUser })
      .expect(201)
      .expect((res) => {
        expect(res.body.tokens).toBeDefined();
        expect(repoMock.save).toHaveBeenCalled();
      });
  });

  it('/auth/login (POST)', async () => {
    // We need a real hash for 'Password123!'
    // Since we can't easily import bcrypt here (it might not be in devDependencies of root?), 
    // actually it is in package.json.
    const bcrypt = require('bcrypt'); // Dynamic require to avoid TS issues if types missing
    const pass = 'Password123!';
    const hash = await bcrypt.hash(pass, 10);

    repoMock.findOneBy.mockImplementation(({ email }) => {
      return Promise.resolve({
        Id: 'e2e-id',
        email,
        password: hash,
        role: 'USER'
      });
    });

    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ user: { email: 'e2e@example.com', password: pass } })
      .expect(201)
      .expect((res) => {
        expect(res.body.tokens).toBeDefined();
      });
  });

  // For login, we need to mock bcrypt.compare which is hard in E2E since it is inside the service.
  // We can just test that the endpoint calls the service logic which calls the repo.
  // Actually, since we can't easily mock bcrypt inside the service in an E2E test without modifying the service to inject a helper,
  // we might have to rely on the fact that if we know the hash returned by findOneBy matches what the service expects...
  // BUT the service uses bcrypt.verify(plain, hash). We can't predict the hash of 'password' easily without actually running bcrypt.hash.
  // The service does `await bcrypt.compare(password, user.password)`.
  // If we return a REAL hash compatible with 'Password123!' in our mock for findOneBy, it will work.
  // Let's rely on standard bcrypt behavior or skip login E2E if too flaky without real DB.
  // Wait, I can perform a real hash in the test setup and put it in the mock return!


});
