import { Test, TestingModule } from '@nestjs/testing';
import { SnapsService } from './snaps.service';

describe('SnapsService', () => {
  let service: SnapsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SnapsService],
    }).compile();

    service = module.get<SnapsService>(SnapsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
