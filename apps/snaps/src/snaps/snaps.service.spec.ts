import { Test, TestingModule } from '@nestjs/testing';
import { SnapsService } from './snaps.service';
import { getModelToken } from '@nestjs/mongoose';
import { Snap, SnapStatus, Tags } from './schemas/snap.schema';
import { SnapsGateway } from '../gateway';
import {
  STORAGE_REDIS,
  STORAGE_GRPC,
  USERS_GRPC,
  handleMongoError,
} from 'nowhere-common';
import { USERS_SERVICE_NAME, AWS_STORAGE_SERVICE_NAME } from 'proto';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { of } from 'rxjs';

// Mock nowhere-common if needed, but for now we might mock specific functions if jest allows or use spy
jest.mock('nowhere-common', () => ({
  ...jest.requireActual('nowhere-common'),
  USERS_GRPC: 'USERS_GRPC',
  STORAGE_GRPC: 'STORAGE_GRPC',
  STORAGE_REDIS: 'STORAGE_REDIS',
  deleteFromFolder: jest.fn().mockResolvedValue(undefined),
  handleMongoError: jest.fn(),
}));

describe('SnapsService', () => {
  let service: SnapsService;
  let snapModel: any;
  let redisClient: any;
  let storageClient: any;
  let usersClient: any;
  let snapsGateway: any;
  let usersServiceMock: any;
  let storageServiceMock: any;

  beforeEach(async () => {
    usersServiceMock = {
      getSettings: jest.fn(),
      notSeenSnaps: jest.fn(),
      setSeenSnap: jest.fn(),
    };

    storageServiceMock = {
      getSignedUrLs: jest.fn(),
    };

    snapModel = {
      findOne: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      deleteOne: jest.fn(),
      deleteMany: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };

    // Mock the constructor for new this.snapModel()
    const snapModelConstructor = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ ...dto, id: 'saved_id' }),
    }));
    Object.assign(snapModelConstructor, snapModel);

    redisClient = {
      emit: jest.fn(),
    };

    storageClient = {
      getService: jest.fn().mockReturnValue(storageServiceMock),
    };

    usersClient = {
      getService: jest.fn().mockReturnValue(usersServiceMock),
    };

    snapsGateway = {
      handleNewSnap: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SnapsService,
        {
          provide: getModelToken(Snap.name),
          useValue: snapModelConstructor,
        },
        {
          provide: STORAGE_REDIS,
          useValue: redisClient,
        },
        {
          provide: STORAGE_GRPC,
          useValue: storageClient,
        },
        {
          provide: USERS_GRPC,
          useValue: usersClient,
        },
        {
          provide: SnapsGateway,
          useValue: snapsGateway,
        },
      ],
    }).compile();

    service = module.get<SnapsService>(SnapsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize grpc services', () => {
      service.onModuleInit();
      expect(usersClient.getService).toHaveBeenCalledWith(USERS_SERVICE_NAME);
      expect(storageClient.getService).toHaveBeenCalledWith(
        AWS_STORAGE_SERVICE_NAME,
      );
    });
  });

  describe('getNearParams', () => {
    it('should return default params if no user settings', async () => {
      // Manually trigger onModuleInit to set services
      service.onModuleInit();
      usersServiceMock.getSettings.mockReturnValue(of({}));

      const params = await service.getNearParams({ _userId: 'u1' });
      expect(params).toBeDefined();
      expect(params.visionDistance).toBeDefined();
    });
  });

  describe('create', () => {
    it('should create a snap successfully', async () => {
      service.onModuleInit();
      usersServiceMock.getSettings.mockReturnValue(of({}));

      // Mock findOne to return null (no existing snap)
      snapModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null),
          }),
        }),
      });

      const createDto: any = { location: JSON.stringify([0, 0]) };
      const files: any[] = [];

      const result = await service.create('u1', files, createDto);

      expect(result?.id).toEqual('saved_id');
      expect(redisClient.emit).toHaveBeenCalledWith(
        'upload-snap',
        expect.anything(),
      );
      expect(snapsGateway.handleNewSnap).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user already posted', async () => {
      service.onModuleInit();
      usersServiceMock.getSettings.mockReturnValue(of({}));

      // Mock findOne to return existing snap
      snapModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue({ _id: 'exists' }),
          }),
        }),
      });

      const createDto: any = { location: JSON.stringify([0, 0]) };

      await expect(service.create('u1', [], createDto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('handleCreateSnap', () => {
    it('should handle error and delete snap', async () => {
      service.deleteSnap = jest.fn().mockResolvedValue({} as any);
      const data: any = { error: 'some error', snapId: 's1', filesNames: [] };

      await expect(service.handleCreateSnap(data)).rejects.toThrow(
        BadRequestException,
      );
      expect(service.deleteSnap).toHaveBeenCalledWith('s1');
    });

    it('should update snap images on success', async () => {
      service.updateSnapImages = jest.fn().mockResolvedValue({});
      const data: any = { snapId: 's1', keys: ['k1'], filesNames: [] };

      await service.handleCreateSnap(data);

      expect(service.updateSnapImages).toHaveBeenCalledWith('s1', ['k1']);
    });
  });

  describe('findNear', () => {
    it('should find near snaps', async () => {
      service.onModuleInit();
      usersServiceMock.getSettings.mockReturnValue(of({}));

      snapModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      await service.findNear({ location: [0, 0], tags: [], _userId: 'u1' });
      expect(snapModel.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return snap with signed urls', async () => {
      service.onModuleInit();
      const snap = { _id: 's1', snaps: ['k1'] };
      snapModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(snap),
      });

      storageServiceMock.getSignedUrLs.mockReturnValue(of({ urls: ['url1'] }));
      usersServiceMock.notSeenSnaps.mockReturnValue(of({})); // not seen
      usersServiceMock.setSeenSnap.mockReturnValue(of({ success: true }));

      const result = await service.findOne('s1', 'u1');
      expect(result.snap).toEqual(snap);
      expect(result.imageKeys).toEqual(['url1']);
      expect(usersServiceMock.setSeenSnap).toHaveBeenCalled();
    });

    it('should throw NotFoundException if snap not found', async () => {
      snapModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(service.findOne('s1', 'u1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteSnap', () => {
    it('should delete snap', async () => {
      snapModel.deleteOne.mockResolvedValue({ deletedCount: 1 });
      await service.deleteSnap('s1');
      expect(snapModel.deleteOne).toHaveBeenCalledWith({ _id: 's1' });
    });
  });

  describe('deleteAll', () => {
    it('should delete all snaps', async () => {
      snapModel.deleteMany.mockResolvedValue({ deletedCount: 5 });
      await service.deleteAll();
      expect(snapModel.deleteMany).toHaveBeenCalled();
    });
  });

  describe('findByTags', () => {
    it('should find by tags', async () => {
      snapModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });
      await service.findByTags();
      expect(snapModel.find).toHaveBeenCalled();
    });
  });

  describe('getSeenSnaps', () => {
    it('should return near snaps if no userId', async () => {
      service.onModuleInit();
      service.findNear = jest.fn().mockResolvedValue(['snap1']);
      const result = await service.getSeenSnaps({} as any, null as any);
      expect(result).toEqual(['snap1']);
    });

    it('should filter seen snaps', async () => {
      service.onModuleInit();
      service.findNear = jest
        .fn()
        .mockResolvedValue([{ id: 's1' }, { id: 's2' }]);
      // Mock notSeenSnaps
      // s1 -> seen (returns object), s2 -> not seen (returns empty)
      usersServiceMock.notSeenSnaps.mockImplementation((args) => {
        return of({ seen: [{ snapId: 's1', userId: 'u1' }] });
      });

      const result = await service.getSeenSnaps({} as any, 'u1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toEqual('s1');
    });
  });

  describe('updateSnapImages', () => {
    it('should update snap images', async () => {
      snapModel.findOneAndUpdate.mockReturnValue({
        new: true,
      });
      await service.updateSnapImages('s1', ['k1']);
      expect(snapModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 's1' },
        { snaps: ['k1'], status: SnapStatus.SUCCESS },
        { new: true },
      );
    });
  });
});
