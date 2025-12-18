import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';
import { SigninDTO } from './dto/signin.dto';
import { CreateCredentialDTO } from './dto/create-credential-dto';
import { Roles } from './entities/user-credentials-entity';

import { JwtGuard } from 'nowhere-common';

describe('AuthenticationController', () => {
    let controller: AuthenticationController;
    let service: AuthenticationService;

    const mockUser = {
        Id: 'user-id',
        email: 'test@example.com',
        role: Roles.USER,
    };
    const mockTokens = { accessToken: 'access', refreshToken: 'refresh' };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthenticationController],
            providers: [
                {
                    provide: AuthenticationService,
                    useValue: {
                        login: jest.fn().mockResolvedValue({ user: mockUser, tokens: mockTokens }),
                        signup: jest.fn().mockResolvedValue({ user: mockUser, tokens: mockTokens }),
                        refreshToken: jest.fn().mockResolvedValue({ user: mockUser, tokens: mockTokens }),
                    },
                },
            ],
        })
            .overrideGuard(JwtGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<AuthenticationController>(AuthenticationController);
        service = module.get<AuthenticationService>(AuthenticationService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('login', () => {
        it('should call service.login', async () => {
            const dto: SigninDTO = { email: 't@e.com', password: 'p' };
            const result = await controller.login(dto);
            expect(service.login).toHaveBeenCalledWith(dto.email, dto.password);
            expect(result).toEqual({ user: mockUser, tokens: mockTokens });
        });
    });

    describe('signup', () => {
        it('should call service.signup', async () => {
            const dto: CreateCredentialDTO = { email: 't@e.com', password: 'p' };
            const result = await controller.signup(dto);
            expect(service.signup).toHaveBeenCalledWith(dto);
            expect(result).toEqual({ user: mockUser, tokens: mockTokens });
        });
    });

    describe('refresh', () => {
        it('should call service.refreshToken', async () => {
            const req = { headers: { authorization: 'Bearer t' } } as any;
            const result = await controller.refresh(req);
            expect(service.refreshToken).toHaveBeenCalledWith('t');
            expect(result).toEqual({ user: mockUser, tokens: mockTokens });
        });
    });

    describe('validateAuthUser (gRPC)', () => {
        it('should format date and return result', async () => {
            const userWithDate = { ...mockUser, lastLoginAt: new Date(1000) };
            jest.spyOn(service, 'login').mockResolvedValue({ user: userWithDate, tokens: mockTokens } as any);

            const result = await controller.validateAuthUser({ email: 'e', password: 'p' });
            expect(result.user.lastLoginAt).toBeDefined();
            expect(result.user.lastLoginAt!.seconds).toBe(1);
        });
    });

    describe('signupGrpc', () => {
        it('should call signup', async () => {
            const dto = { email: 'e', password: 'p' };
            await controller.signupGrpc(dto as any);
            expect(service.signup).toHaveBeenCalledWith(dto);
        });
    });

    describe('refreshTokenGrpc', () => {
        it('should call refreshToken', async () => {
            await controller.refreshTokenGrpc({ token: 't' });
            expect(service.refreshToken).toHaveBeenCalledWith('t');
        });
    });
});
