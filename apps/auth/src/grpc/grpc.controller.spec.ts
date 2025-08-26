import { Test, TestingModule } from '@nestjs/testing';
import { GrpcController } from './grpc.controller';
import { GrpcService } from './grpc.service';

describe('GrpcController', () => {
  let controller: GrpcController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GrpcController],
      providers: [GrpcService],
    }).compile();

    controller = module.get<GrpcController>(GrpcController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
