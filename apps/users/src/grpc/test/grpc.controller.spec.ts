import { Test, TestingModule } from '@nestjs/testing';
import { GrpcController } from '../grpc.controller';
import { GrpcService } from '../grpc.service';

describe('GrpcController (unit)', () => {
  let controller: GrpcController;
  let grpcService: Partial<
    Record<'validateUser' | 'validateToken' | 'getUserSetting', jest.Mock>
  >;

  beforeEach(async () => {
    grpcService = {
      validateUser: jest.fn(),
      validateToken: jest.fn(),
      getUserSetting: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GrpcController],
      providers: [{ provide: GrpcService, useValue: grpcService }],
    }).compile();

    controller = module.get<GrpcController>(GrpcController);
  });

  afterEach(() => jest.resetAllMocks());

  it('validateUser should forward dto to service and return user', async () => {
    const dto = { email: 'a', password: 'p' } as any;
    const user = { email: dto.email } as any;
    (grpcService.validateUser as jest.Mock).mockResolvedValue(user);

    await expect(controller.validateUser(dto)).resolves.toEqual(user);
    expect(grpcService.validateUser).toHaveBeenCalledWith(dto);
  });

  it('validateToken should forward token and return user', async () => {
    const req = { token: 'tok' } as any;
    const user = { email: 'a' } as any;
    (grpcService.validateToken as jest.Mock).mockResolvedValue(user);

    await expect(controller.validateToken(req)).resolves.toEqual(user);
    expect(grpcService.validateToken).toHaveBeenCalledWith(req.token);
  });

  it('getUserSetting should call service and return settings', async () => {
    const dto = { id: 'u1' } as any;
    const settings = { theme: 'dark' } as any;
    (grpcService.getUserSetting as jest.Mock).mockResolvedValue(settings);

    await expect(controller.getUserSetting(dto)).resolves.toEqual(settings);
    expect(grpcService.getUserSetting).toHaveBeenCalledWith(dto.id);
  });
});
