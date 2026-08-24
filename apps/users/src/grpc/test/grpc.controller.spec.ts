import { Test, TestingModule } from '@nestjs/testing';
import { GrpcController } from '../grpc.controller';
import { GrpcService } from '../grpc.service';

describe('GrpcController (unit)', () => {
  let controller: GrpcController;
  let grpcService: Partial<
    Record<
      | 'createUserInfo'
      | 'createUser'
      | 'getAllUsers'
      | 'getUserSetting'
      | 'notSeen'
      | 'setSeen',
      jest.Mock
    >
  >;

  beforeEach(async () => {
    grpcService = {
      createUser: jest.fn(),
      getAllUsers: jest.fn(),
      getUserSetting: jest.fn(),
      notSeen: jest.fn(),
      setSeen: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GrpcController],
      providers: [{ provide: GrpcService, useValue: grpcService }],
    }).compile();

    controller = module.get<GrpcController>(GrpcController);
  });

  afterEach(() => jest.resetAllMocks());

  it('createUserInfo should forward dto to service and return proto user', async () => {
    const dto = {
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      bio: '',
      authId: 'auth-123',
    } as any;
    const user = {
      id: 'u1',
      email: dto.email,
      firstName: 'John',
      lastName: 'Doe',
      bio: '',
      image: '',
    } as any;
    (grpcService.createUser as jest.Mock).mockResolvedValue(user);

    const result = await controller.createUserInfo(dto);
    expect(result.email).toEqual(user.email);
    expect(grpcService.createUser).toHaveBeenCalledWith(dto);
  });

  it('getAllUsersInfo should return all users in UsersObject', async () => {
    const users = [{ id: 'u1', email: 'test@example.com' }] as any;
    (grpcService.getAllUsers as jest.Mock).mockResolvedValue(users);

    const result = await controller.getAllUsersInfo({});
    expect(result).toEqual({ users });
    expect(grpcService.getAllUsers).toHaveBeenCalled();
  });

  it('getSettings should call service and return settings', async () => {
    const dto = { id: 'u1' } as any;
    const settings = {
      id: 's1',
      maxDistance: 5000,
      newSnapDistance: 500,
      snapDisappearTime: 3600,
    } as any;
    (grpcService.getUserSetting as jest.Mock).mockResolvedValue(settings);

    await expect(controller.getSettings(dto)).resolves.toEqual(settings);
    expect(grpcService.getUserSetting).toHaveBeenCalledWith(dto.id);
  });

  it('notSeenSnaps should forward request to service', async () => {
    const request = { seen: false, userId: 'u1', snapIds: ['s1'] } as any;
    const response = { seen: [{ snapId: 's1', userId: 'u1' }] } as any;
    (grpcService.notSeen as jest.Mock).mockResolvedValue(response);

    await expect(controller.notSeenSnaps(request)).resolves.toEqual(response);
    expect(grpcService.notSeen).toHaveBeenCalledWith(request);
  });

  it('setSeenSnap should forward request to service', async () => {
    const request = { snapId: 's1', userId: 'u1' } as any;
    const response = { success: true } as any;
    (grpcService.setSeen as jest.Mock).mockResolvedValue(response);

    await expect(controller.setSeenSnap(request)).resolves.toEqual(response);
    expect(grpcService.setSeen).toHaveBeenCalledWith(request);
  });
});
