
import { Test, TestingModule } from '@nestjs/testing';
import { SnapsController } from './snaps.controller';
import { SnapsService } from './snaps.service';
import { JwtGuard, RoleGuard } from 'nowhere-common';

describe('SnapsController', () => {
  let controller: SnapsController;
  let service: any;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      handleCreateSnap: jest.fn(),
      findByTags: jest.fn(),
      findOne: jest.fn(),
      deleteAll: jest.fn(),
      getSeenSnaps: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SnapsController],
      providers: [
        {
          provide: SnapsService,
          useValue: service,
        },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RoleGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SnapsController>(SnapsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('saveUploadedSnaps', () => {
    it('should call handleCreateSnap', async () => {
      const data: any = { snapId: 's1' };
      await controller.saveUploadedSnaps(data);
      expect(service.handleCreateSnap).toHaveBeenCalledWith(data);
    });
  });

  describe('create', () => {
    it('should call service.create', async () => {
      const dto: any = { location: [0, 0] };
      const files: any = [];
      await controller.create('u1', files, dto);
      expect(service.create).toHaveBeenCalledWith('u1', files, dto);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll', async () => {
      await controller.findAll();
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findByTags', () => {
    it('should call service.findByTags', async () => {
      const query: any = { tags: ['t1'] };
      await controller.findByTags(query);
      expect(service.findByTags).toHaveBeenCalledWith(['t1']);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne', async () => {
      await controller.findOne('u1', 's1');
      expect(service.findOne).toHaveBeenCalledWith('s1', 'u1');
    });
  });

  describe('deleteAll', () => {
    it('should call service.deleteAll', async () => {
      await controller.deleteAll();
      expect(service.deleteAll).toHaveBeenCalled();
    });
  });

  describe('findNear', () => {
    it('should call service.getSeenSnaps', async () => {
      const location: any = { lng: 1, lat: 2 };
      const query: any = { id: 'u1' };
      await controller.findNear(location, query);
      expect(service.getSeenSnaps).toHaveBeenCalledWith(
        expect.objectContaining({
          location: [1, 2],
          id: 'u1',
        }),
        'u1',
        false,
      );
    });
  });

  describe('getSeenSnaps', () => {
    it('should call service.getSeenSnaps', async () => {
      const location: any = { lng: 1, lat: 2 };
      const query: any = {};
      await controller.getSeenSnaps('u1', location, query);
      expect(service.getSeenSnaps).toHaveBeenCalledWith(
        expect.objectContaining({ location: [1, 2] }),
        'u1',
        false,
      );
    });
  });
});
