import { Test, TestingModule } from '@nestjs/testing';
import { SnapsController } from './snaps.controller';
import { SnapsService } from './snaps.service';

describe('SnapsController', () => {
  let controller: SnapsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SnapsController],
      providers: [SnapsService],
    }).compile();

    controller = module.get<SnapsController>(SnapsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
