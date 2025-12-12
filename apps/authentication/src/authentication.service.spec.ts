
import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationService } from './authentication.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Credential } from './entities/user-credentials-entity';
import { Repository } from 'typeorm';

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let repo: Repository<Credential>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('token'),
            verifyAsync: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('secret'),
          },
        },
        {
          provide: getRepositoryToken(Credential),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOneBy: jest.fn(),
          },
        },
        {
          provide: 'AUTH_PACKAGE',
          useValue: {
            getService: jest.fn().mockReturnValue({
              createUser: jest.fn().mockReturnValue({ pipe: jest.fn() }),
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthenticationService>(AuthenticationService);
    repo = module.get<Repository<Credential>>(getRepositoryToken(Credential));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
