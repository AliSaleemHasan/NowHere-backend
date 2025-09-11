jest.mock('nowhere-common', () => ({
  extractTokenFromHeader: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationController } from '../authentication.controller';
import { AuthenticationService } from '../authentication.service';
import { Request } from 'express';
import { extractTokenFromHeader } from 'nowhere-common';

describe('AuthenticationController (Unit)', () => {
  let module: TestingModule;
  let controller: AuthenticationController;

  // Mock service
  let service = {
    login: jest.fn(),
    signup: jest.fn(),
    refreshToken: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [AuthenticationController],
      providers: [
        {
          provide: AuthenticationService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<AuthenticationController>(AuthenticationController);
  });

  afterEach(() => jest.resetAllMocks());

  it('login should forward user info to service and return user', async () => {
    const signInDTO = { email: 'jacob@test.com', password: 'test' };
    const user = { ...signInDTO, first_name: 'jacob', last_name: 'test' };

    (service.login as jest.Mock).mockResolvedValue(user);

    await expect(controller.login(signInDTO)).resolves.toBe(user);
    expect(service.login).toHaveBeenCalledWith(
      signInDTO.email,
      signInDTO.password,
    );
  });

  it('signup should forward new user info to service and return new user', async () => {
    const createUserDto = {
      first_name: 'test',
      last_name: 'test',
      email: 'test@test.com',
      password: 'pass',
      bio: '',
    };
    const user = { id: 'userOD', ...createUserDto };

    (service.signup as jest.Mock).mockResolvedValue(user);

    await expect(controller.signup(createUserDto)).resolves.toBe(user);
    expect(service.signup).toHaveBeenCalledWith(createUserDto);
  });

  it('refresh should extract token from header and pass it to service', async () => {
    const req = { headers: { authorization: 'Bearer token123' } } as Request;
    const fakeUser = { id: 'u1', email: 'jacob@test.com' };

    // mock extractTokenFromHeader
    (extractTokenFromHeader as jest.Mock).mockReturnValue('token123');
    (service.refreshToken as jest.Mock).mockResolvedValue(fakeUser);

    await expect(controller.refresh(req)).resolves.toBe(fakeUser);

    expect(extractTokenFromHeader).toHaveBeenCalledWith(req);
    expect(service.refreshToken).toHaveBeenCalledWith('token123');
  });
});
