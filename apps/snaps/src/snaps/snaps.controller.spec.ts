import { Test, TestingModule } from '@nestjs/testing';
import { SnapsNatsController } from './controllers/snaps.nats.controller';
import { SnapsCreateService } from './snaps-create.service';
import { SnapsDeleteService } from './snaps-delete.service';
import { SnapsQueryService } from './snaps-query.service';
import { SnapsResolutionService } from './snaps-resolution.service';
import { ROLES } from 'contracts';

describe('SnapsNatsController', () => {
  let controller: SnapsNatsController;
  let query: {
    findAll: jest.Mock;
    findByTags: jest.Mock;
    findOne: jest.Mock;
    findByUser: jest.Mock;
    getSeenSnaps: jest.Mock;
  };
  let create: { create: jest.Mock };
  let remove: {
    deleteAll: jest.Mock;
    deleteSnap: jest.Mock;
    deleteByUserId: jest.Mock;
  };
  let resolution: { markFound: jest.Mock; reopen: jest.Mock };

  beforeEach(async () => {
    query = {
      findAll: jest.fn(),
      findByTags: jest.fn(),
      findOne: jest.fn(),
      findByUser: jest.fn(),
      getSeenSnaps: jest.fn(),
    };
    create = { create: jest.fn() };
    remove = {
      deleteAll: jest.fn(),
      deleteSnap: jest.fn(),
      deleteByUserId: jest.fn(),
    };
    resolution = { markFound: jest.fn(), reopen: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SnapsNatsController],
      providers: [
        { provide: SnapsQueryService, useValue: query },
        { provide: SnapsCreateService, useValue: create },
        { provide: SnapsDeleteService, useValue: remove },
        { provide: SnapsResolutionService, useValue: resolution },
      ],
    }).compile();

    controller = module.get<SnapsNatsController>(SnapsNatsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call create service', async () => {
      const dto = {
        userId: 'u1',
        location: {
          type: 'Point' as const,
          coordinates: [0, 0] as [number, number],
        },
        snaps: ['snaps/2026-09-03/u1/a.jpg'],
      };
      await controller.create(dto);
      expect(create.create).toHaveBeenCalledWith('u1', dto);
    });
  });

  describe('findAll', () => {
    it('should call query.findAll', async () => {
      await controller.findAll();
      expect(query.findAll).toHaveBeenCalled();
    });
  });

  describe('findNear', () => {
    it('should call query.getSeenSnaps with seen: false', async () => {
      await controller.findNear({ userId: 'u1', lng: 1, lat: 2 });
      expect(query.getSeenSnaps).toHaveBeenCalledWith(
        { tags: undefined, location: [1, 2] },
        'u1',
        false,
      );
    });

    it('coerces a single HTTP tag string into a tag list', async () => {
      await controller.findNear({
        userId: 'u1',
        lng: 4.9,
        lat: 52.3,
        tags: 'LOST' as never,
      });
      expect(query.getSeenSnaps).toHaveBeenCalledWith(
        { tags: ['LOST'], location: [4.9, 52.3] },
        'u1',
        false,
      );
    });
  });

  describe('deleteOne', () => {
    it('forwards id with actor identity', async () => {
      await controller.deleteOne({
        id: 's1',
        userId: 'u1',
        role: ROLES.USER,
      });
      expect(remove.deleteSnap).toHaveBeenCalledWith('s1', {
        userId: 'u1',
        role: ROLES.USER,
      });
    });
  });

  describe('findByUser', () => {
    it('calls query.findByUser', async () => {
      await controller.findByUser({ userId: 'u1', includeExpired: false });
      expect(query.findByUser).toHaveBeenCalledWith('u1', false);
    });
  });

  describe('deleteByUserId', () => {
    it('forwards userId to deleteByUserId', async () => {
      await controller.deleteByUserId({ userId: 'u1' });
      expect(remove.deleteByUserId).toHaveBeenCalledWith('u1');
    });
  });

  describe('markFound', () => {
    it('forwards id, userId, and note', async () => {
      await controller.markFound({
        id: 's1',
        userId: 'u2',
        note: 'here',
      });
      expect(resolution.markFound).toHaveBeenCalledWith('s1', 'u2', 'here');
    });
  });

  describe('reopen', () => {
    it('forwards id and userId', async () => {
      await controller.reopen({ id: 's1', userId: 'u1' });
      expect(resolution.reopen).toHaveBeenCalledWith('s1', 'u1');
    });
  });
});
