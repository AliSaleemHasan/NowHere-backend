import { Test, TestingModule } from '@nestjs/testing';
import { AuthNatsController } from './controllers/auth.nats.controller';
import { AuthenticationService } from './authentication.service';
import { ROLES as Roles } from 'contracts';

describe('AuthNatsController', () => {
  let controller: AuthNatsController;
  let service: AuthenticationService;

  const mockUser = { id: 'user-id', email: 'test@example.com', role: Roles.USER, isActive: true };
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
      ],
    }).compile();

    controller = module.get<AuthNatsController>(AuthNatsController);
    service = module.get<AuthenticationService>(AuthenticationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('validateUser', () => {
    it('should call service.login', async () => {
      const result = await controller.validateUser({ email: 't@e.com', password: 'password1' });
      expect(service.login).toHaveBeenCalledWith('t@e.com', 'password1');
      expect(result).toEqual(authResponse);
    });
  });

  describe('signup', () => {
    it('should call service.signup', async () => {
      const dto = { email: 't@e.com', password: 'password1', firstName: 'John', lastName: 'Doe' };
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
});
