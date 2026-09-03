import { Test, TestingModule } from '@nestjs/testing';
import { SnapsNatsController } from './controllers/snaps.nats.controller';
import { SnapsService } from './snaps.service';

describe('SnapsNatsController', () => {
  let controller: SnapsNatsController;
  let service: any;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findByTags: jest.fn(),
      findOne: jest.fn(),
      deleteAll: jest.fn(),
      deleteSnap: jest.fn(),
      getSeenSnaps: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SnapsNatsController],
      providers: [{ provide: SnapsService, useValue: service }],
    }).compile();

    controller = module.get<SnapsNatsController>(SnapsNatsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create', async () => {
      const dto: any = {
        userId: 'u1',
        location: { type: 'Point', coordinates: [0, 0] },
        snaps: ['snaps/2026-09-03/u1/a.jpg'],
      };
      await controller.create(dto);
      expect(service.create).toHaveBeenCalledWith('u1', dto);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll', async () => {
      await controller.findAll();
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findNear', () => {
    it('should call service.getSeenSnaps with seen: false', async () => {
      await controller.findNear({ userId: 'u1', lng: 1, lat: 2 });
      expect(service.getSeenSnaps).toHaveBeenCalledWith(
        { tags: undefined, location: [1, 2] },
        'u1',
        false,
      );
    });
  });
});
