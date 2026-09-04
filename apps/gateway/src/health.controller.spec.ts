import { Test, TestingModule } from '@nestjs/testing';
import { MemoryHealthController as HealthController } from 'nowhere-common';
import { HealthCheckService, MemoryHealthIndicator } from '@nestjs/terminus';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: { check: jest.fn().mockResolvedValue('ok') },
        },
        {
          provide: MemoryHealthIndicator,
          useValue: { checkHeap: jest.fn().mockResolvedValue('ok') },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
