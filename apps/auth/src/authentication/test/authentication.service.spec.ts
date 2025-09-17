import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationService } from '../authentication.service';
import { UsersService } from '../../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GrpcService } from '../../grpc/grpc.service';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';

describe('AuthenticationService', () => {
  let service: AuthenticationService;

  const mockUsersService = {
    getUserByEmail: jest.fn(),
    createUser: jest.fn(),
  };

  const mockGrpcService = {
    getUserSetting: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: GrpcService, useValue: mockGrpcService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthenticationService>(AuthenticationService);

    // Default mocks
    jest
      .spyOn(bcrypt, 'compare')
      .mockImplementation(
        async (pw, hash) => pw === 'plain' && hash === 'hashed',
      );
    jest.spyOn(bcrypt, 'hash').mockImplementation(async (pw, salt) => 'hashed');
    (jest.spyOn(bcrypt, 'genSalt') as jest.Mock).mockResolvedValue('salt');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // ------------------- LOGIN -------------------
  describe('login', () => {
    it('should return user and tokens on successful login', async () => {
      const user = { Id: 'u1', email: 'test@test.com', password: 'hashed' };
      mockUsersService.getUserByEmail.mockResolvedValue(user);
      jest
        .spyOn(service, 'generateTokens')
        .mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });

      const result = await service.login('test@test.com', 'plain');
      expect(result.user).toEqual(user);
      expect(result.tokens).toEqual({ accessToken: 'a', refreshToken: 'r' });
      expect(mockUsersService.getUserByEmail).toHaveBeenCalledWith(
        'test@test.com',
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUsersService.getUserByEmail.mockResolvedValue(null);
      await expect(service.login('test@test.com', 'plain')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      const user = { Id: 'u1', email: 'test@test.com', password: 'hashed' };
      mockUsersService.getUserByEmail.mockResolvedValue(user);
      await expect(service.login('test@test.com', 'wrong')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ------------------- SIGNUP -------------------
  describe('signup', () => {
    it('should create user and settings successfully', async () => {
      const createUserDto = { email: 'test@test.com', password: 'plain' };
      const newUser = { Id: 'u1', ...createUserDto };
      mockUsersService.createUser.mockResolvedValue(newUser);
      mockGrpcService.getUserSetting.mockResolvedValue({});

      const result = await service.signup(createUserDto as any);
      expect(result).toEqual(newUser);
      expect(mockUsersService.createUser).toHaveBeenCalled();
      expect(mockGrpcService.getUserSetting).toHaveBeenCalledWith('u1');
    });

    it('should throw BadRequestException if email already exists', async () => {
      const createUserDto = { email: 'test@test.com', password: 'plain' };
      mockUsersService.createUser.mockRejectedValue(new Error('duplicate key'));

      await expect(service.signup(createUserDto as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ------------------- REFRESH TOKEN -------------------
  describe('refreshToken', () => {
    it('should return new tokens if token is valid', async () => {
      const payload = { user: { Id: 'u1', email: 'a@b.com' }, sub: 'u1' };
      mockJwtService.verifyAsync.mockResolvedValue(payload);
      jest
        .spyOn(service, 'generateTokens')
        .mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });

      const result = await service.refreshToken('token123');
      expect(result.user).toEqual(payload.user);
      expect(result.tokens).toEqual({ accessToken: 'a', refreshToken: 'r' });
      expect(mockJwtService.verifyAsync).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if token is missing', async () => {
      await expect(service.refreshToken(undefined)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('invalid'));
      await expect(service.refreshToken('badtoken')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
