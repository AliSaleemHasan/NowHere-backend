import { Test, TestingModule } from '@nestjs/testing';
import { GrpcService } from '../grpc.service';
import { UsersService } from '../../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Settings } from '../../settings/entities/settings.entity';
import { ObjectLiteral, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';

type MockRepo<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

const mockSettingsRepository = (): MockRepo<Settings> => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockUsersService = () => ({
  getUserByEmail: jest.fn(),
  getUserById: jest.fn(),
});

const mockConfigService = () => ({
  get: jest.fn(),
});

const mockJwtService = () => ({
  verifyAsync: jest.fn(),
});

describe('Grpc Service (Unit)', () => {
  let service: GrpcService;
  let usersService: ReturnType<typeof mockUsersService>;
  let configService: ReturnType<typeof mockConfigService>;
  let jwtService: ReturnType<typeof mockJwtService>;
  let settingsRepo: MockRepo<Settings>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GrpcService,
        { provide: UsersService, useFactory: mockUsersService },
        { provide: JwtService, useFactory: mockJwtService },
        { provide: ConfigService, useFactory: mockConfigService },
        {
          provide: getRepositoryToken(Settings),
          useFactory: mockSettingsRepository,
        },
      ],
    }).compile();

    service = module.get<GrpcService>(GrpcService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    settingsRepo = module.get(getRepositoryToken(Settings));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      const dto = { email: 'jacob@test.com', password: 'pass' };
      const user = { email: 'jacob@test.com', password: 'hashedPassword' };

      usersService.getUserByEmail.mockResolvedValue(user);
      (jest.spyOn(bcrypt, 'compare') as jest.Mock).mockResolvedValue(true);

      const res = await service.validateUser(dto);
      expect(res).toBe(user);
      expect(usersService.getUserByEmail).toHaveBeenCalledWith(dto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(dto.password, user.password);
    });

    it('should throw UnauthorizedException if user  not found', async () => {
      usersService.getUserByEmail.mockResolvedValue(null);

      await expect(
        service.validateUser({ email: 'x', password: 'u' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      const user = { email: 'jacob@test.com', password: 'password' };

      usersService.getUserByEmail.mockResolvedValue(user);

      (jest.spyOn(bcrypt, 'compare') as jest.Mock).mockResolvedValue(false);

      expect(
        service.validateUser({ email: 'jacob@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateToken', () => {
    it('should throw when token missing', async () => {
      await expect(service.validateToken(undefined)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.validateToken(undefined)).rejects.toThrow(
        'User is not loggedin/found',
      );
    });

    it('should throw when verify returns payload without user', async () => {
      const token = 'tok';
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({});
      (configService.get as jest.Mock).mockReturnValue('secret');

      await expect(service.validateToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.validateToken(token)).rejects.toThrow(
        /User is not found in the token/,
      );
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(token, {
        secret: 'secret',
      });
    });

    it('should return payload.user when token valid and user exists', async () => {
      const token = 'tok';
      const payloadUser = { email: 'a' } as any;
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
        user: payloadUser,
      });
      (configService.get as jest.Mock).mockReturnValue('secret');
      usersService.getUserByEmail.mockResolvedValue({ email: 'a' } as any);

      const res = await service.validateToken(token);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith(token, {
        secret: 'secret',
      });
      expect(usersService.getUserByEmail).toHaveBeenCalledWith(
        payloadUser.email,
      );
      expect(res).toEqual(payloadUser);
    });

    it('should throw UnauthorizedException when verifyAsync throws', async () => {
      const token = 'tok';
      (jwtService.verifyAsync as jest.Mock).mockRejectedValue(
        new Error('invalid'),
      );
      (configService.get as jest.Mock).mockReturnValue('secret');

      await expect(service.validateToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getUserSetting', () => {
    it('should return settings without user when present', async () => {
      const mock = { user: { Id: 'u' }, theme: 'dark' } as any;
      (settingsRepo.findOne as jest.Mock).mockResolvedValue(mock);

      const res = await service.getUserSetting('u');

      expect(res).toEqual({ theme: 'dark' });
      expect(settingsRepo.findOne).toHaveBeenCalledWith({
        where: { user: { Id: 'u' } },
        relations: { user: true },
      });
    });

    it('should call createUserSettings when settings not found', async () => {
      (settingsRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      const spy = jest
        .spyOn(service, 'createUserSettings')
        .mockResolvedValue({ theme: 'light' } as any);

      const res = await service.getUserSetting('u2');

      expect(spy).toHaveBeenCalledWith('u2');
      expect(res).toEqual({ theme: 'light' });
    });
  });

  describe('createUserSettings', () => {
    it('should create and save settings for a user', async () => {
      const userId = 'u1';
      const user = { Id: userId, email: 'x' } as any;
      (usersService.getUserById as jest.Mock).mockResolvedValue(user);
      const created = { user } as any;
      (settingsRepo.create as jest.Mock).mockReturnValue(created);
      (settingsRepo.save as jest.Mock).mockResolvedValue(created);

      const res = await service.createUserSettings(userId);

      expect(usersService.getUserById).toHaveBeenCalledWith(userId);
      expect(settingsRepo.create).toHaveBeenCalledWith({ user: user as any });
      expect(settingsRepo.save).toHaveBeenCalledWith(created);
      expect(res).toEqual(created);
    });
  });
});
