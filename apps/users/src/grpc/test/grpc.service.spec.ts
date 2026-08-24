import { Test, TestingModule } from '@nestjs/testing';
import { GrpcService } from '../grpc.service';
import { UsersService } from '../../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

const mockUsersService = () => ({
  getUserByEmail: jest.fn(),
  getUserById: jest.fn(),
  getAllUsers: jest.fn(),
  createUser: jest.fn(),
  getUserSetting: jest.fn(),
  createUserSettings: jest.fn(),
  getSeen: jest.fn(),
  addSeen: jest.fn(),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GrpcService,
        { provide: UsersService, useFactory: mockUsersService },
        { provide: JwtService, useFactory: mockJwtService },
        { provide: ConfigService, useFactory: mockConfigService },
      ],
    }).compile();

    service = module.get<GrpcService>(GrpcService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return all users from usersService', async () => {
      const mockUsers = [{ id: 'u1', email: 'test@example.com' }] as any;
      usersService.getAllUsers.mockResolvedValue(mockUsers);

      const result = await service.getAllUsers();
      expect(result).toEqual(mockUsers);
      expect(usersService.getAllUsers).toHaveBeenCalled();
    });
  });

  describe('createUser', () => {
    it('should call usersService.createUser and return data', async () => {
      const dto = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        bio: '',
        authId: 'a1',
      };
      const createdUser = { id: 'u1', ...dto } as any;
      usersService.createUser.mockResolvedValue(createdUser);

      const result = await service.createUser(dto);
      expect(result).toEqual(createdUser);
      expect(usersService.createUser).toHaveBeenCalledWith(dto);
    });
  });

  describe('validateToken', () => {
    it('should throw when token missing', async () => {
      await expect(service.validateToken(undefined)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw when verify returns payload without user', async () => {
      const token = 'tok';
      jwtService.verifyAsync.mockResolvedValue({});
      configService.get.mockReturnValue('secret');

      await expect(service.validateToken(token)).rejects.toThrow();
    });

    it('should return payload.user when token valid and user exists', async () => {
      const token = 'tok';
      const payloadUser = { email: 'a@test.com' } as any;
      jwtService.verifyAsync.mockResolvedValue({
        user: payloadUser,
      });
      configService.get.mockReturnValue('secret');
      usersService.getUserByEmail.mockResolvedValue({
        email: 'a@test.com',
      } as any);

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
      jwtService.verifyAsync.mockRejectedValue(new Error('invalid'));
      configService.get.mockReturnValue('secret');

      await expect(service.validateToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getUserSetting', () => {
    it('should call usersService.getUserSetting', async () => {
      const settings = { maxDistance: 5000 } as any;
      usersService.getUserSetting.mockResolvedValue(settings);

      const res = await service.getUserSetting('u1');
      expect(res).toEqual(settings);
      expect(usersService.getUserSetting).toHaveBeenCalledWith('u1');
    });
  });

  describe('notSeen', () => {
    it('should return not seen snaps', async () => {
      const seenList = [{ snapId: 's1', userId: 'u1' }] as any;
      usersService.getSeen.mockResolvedValue(seenList);

      const res = await service.notSeen({
        userId: 'u1',
        seen: false,
        snapIds: ['s1'],
      });
      expect(res).toEqual({ seen: seenList });
    });
  });

  describe('setSeen', () => {
    it('should mark snap as seen', async () => {
      usersService.addSeen.mockResolvedValue({} as any);

      const res = await service.setSeen({ snapId: 's1', userId: 'u1' });
      expect(res).toEqual({ success: true });
      expect(usersService.addSeen).toHaveBeenCalledWith({
        snapId: 's1',
        userId: 'u1',
      });
    });
  });
});
