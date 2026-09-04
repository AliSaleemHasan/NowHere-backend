import { Test, TestingModule } from '@nestjs/testing';
import { AuthNatsController } from './controllers/auth.nats.controller';
import { AuthenticationService } from './authentication.service';
import { ChangePasswordService } from './change-password.service';
import { PasswordResetService } from './password-reset.service';
import { AccountLifecycleService } from './account-lifecycle.service';
import { ROLES as Roles } from 'contracts';

describe('AuthNatsController', () => {
  let controller: AuthNatsController;
  let service: AuthenticationService;
  let changePassword: ChangePasswordService;

  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
    role: Roles.USER,
    isActive: true,
  };
  const mockTokens = { accessToken: 'access', refreshToken: 'refresh' };
  const authResponse = { user: mockUser, tokens: mockTokens };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthNatsController],
      providers: [
        {
          provide: AuthenticationService,
          useValue: {
            login: jest.fn().mockResolvedValue(authResponse),
            signup: jest.fn().mockResolvedValue(authResponse),
            refreshToken: jest.fn().mockResolvedValue(authResponse),
          },
        },
        {
          provide: ChangePasswordService,
          useValue: {
            changePassword: jest.fn().mockResolvedValue({ success: true }),
          },
        },
        {
          provide: PasswordResetService,
          useValue: {
            forgotPassword: jest.fn().mockResolvedValue({ accepted: true }),
            resetPassword: jest.fn().mockResolvedValue({ success: true }),
          },
        },
        {
          provide: AccountLifecycleService,
          useValue: {
            deactivateUser: jest.fn().mockResolvedValue({ success: true }),
            deleteCredentials: jest.fn().mockResolvedValue({ success: true }),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthNatsController>(AuthNatsController);
    service = module.get<AuthenticationService>(AuthenticationService);
    changePassword = module.get<ChangePasswordService>(ChangePasswordService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('validateUser', () => {
    it('should call service.login', async () => {
      const result = await controller.validateUser({
        email: 't@e.com',
        password: 'password1',
      });
      expect(service.login).toHaveBeenCalledWith('t@e.com', 'password1');
      expect(result).toEqual(authResponse);
    });
  });

  describe('signup', () => {
    it('should call service.signup', async () => {
      const dto = {
        email: 't@e.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };
      const result = await controller.signup(dto);
      expect(service.signup).toHaveBeenCalledWith(dto);
      expect(result).toEqual(authResponse);
    });
  });

  describe('refreshToken', () => {
    it('should call service.refreshToken', async () => {
      const result = await controller.refreshToken({ token: 't' });
      expect(service.refreshToken).toHaveBeenCalledWith('t');
      expect(result).toEqual(authResponse);
    });
  });

  describe('changePassword', () => {
    it('should call changePasswordService', async () => {
      const dto = {
        userId: 'user-id',
        currentPassword: 'Password123!',
        newPassword: 'Password456!',
      };
      const result = await controller.changePassword(dto);
      expect(changePassword.changePassword).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ success: true });
    });
  });
});
