import { Test, TestingModule } from '@nestjs/testing';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

describe('GatewayController', () => {
  let gatewayController: GatewayController;
  let gatewayService: GatewayService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [GatewayController],
      providers: [
        GatewayService,
        {
          provide: 'CREDENTIALS_PACKAGE',
          useValue: {
            getService: jest.fn().mockReturnValue({
              validateAuthUser: jest.fn(),
              signup: jest.fn(),
              refreshToken: jest.fn(),
            }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('secret'),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    gatewayController = app.get<GatewayController>(GatewayController);
    gatewayService = app.get<GatewayService>(GatewayService);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(gatewayController.getHello()).toEqual({
        message: 'Hello World!',
      });
    });
  });

  describe('auth', () => {
    it('should call login on gatewayService', async () => {
      const loginSpy = jest
        .spyOn(gatewayService, 'login')
        .mockResolvedValue({ token: 'mock-jwt' } as any);

      const signinDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const result = await gatewayController.login(signinDto);
      expect(loginSpy).toHaveBeenCalledWith(signinDto);
      expect(result).toEqual({ token: 'mock-jwt' });
    });

    it('should call signup on gatewayService', async () => {
      const signupSpy = jest
        .spyOn(gatewayService, 'signup')
        .mockResolvedValue({ success: true } as any);

      const signupDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const result = await gatewayController.signup(signupDto);
      expect(signupSpy).toHaveBeenCalledWith(signupDto);
      expect(result).toEqual({ success: true });
    });
  });
});
