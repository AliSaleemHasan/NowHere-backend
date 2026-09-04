import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { of } from 'rxjs';
import { ProblemCodes, ROLES, StoragePatterns } from 'contracts';
import { NATS_CLIENT } from 'nowhere-common';
import { Snap } from './schemas/snap.schema';
import { SnapsDeleteService } from './snaps-delete.service';

describe('SnapsDeleteService', () => {
  let service: SnapsDeleteService;
  let snapModel: {
    findById: jest.Mock;
    find: jest.Mock;
    deleteOne: jest.Mock;
    deleteMany: jest.Mock;
  };
  let natsClient: { send: jest.Mock };

  const ownedSnap = {
    _id: 's1',
    _userId: 'owner',
    snaps: ['snaps/2026-09-03/owner/a.jpg', 'snaps/2026-09-03/owner/b.jpg'],
  };

  beforeEach(async () => {
    snapModel = {
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(ownedSnap),
      }),
      find: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest
          .fn()
          .mockResolvedValue([
            { snaps: ['snaps/a.jpg'] },
            { snaps: ['snaps/b.jpg', 'snaps/a.jpg'] },
          ]),
      }),
      deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      deleteMany: jest.fn().mockResolvedValue({ deletedCount: 2 }),
    };
    natsClient = { send: jest.fn().mockReturnValue(of(undefined)) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SnapsDeleteService,
        { provide: getModelToken(Snap.name), useValue: snapModel },
        { provide: NATS_CLIENT, useValue: natsClient },
      ],
    }).compile();

    service = module.get(SnapsDeleteService);
  });

  it('forbids a non-owner non-admin with SNAP_NOT_OWNED', async () => {
    try {
      await service.deleteSnap('s1', { userId: 'stranger', role: ROLES.USER });
      throw new Error('expected deleteSnap to reject');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      const exception = err as HttpException;
      expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
      expect(exception.getResponse()).toEqual(
        expect.objectContaining({
          code: ProblemCodes.SNAP_NOT_OWNED,
        }),
      );
    }
    expect(natsClient.send).not.toHaveBeenCalled();
    expect(snapModel.deleteOne).not.toHaveBeenCalled();
  });

  it('deletes storage keys then the document for the owner', async () => {
    const result = await service.deleteSnap('s1', {
      userId: 'owner',
      role: ROLES.USER,
    });

    expect(result).toEqual({ deletedCount: 1 });
    expect(natsClient.send).toHaveBeenCalledWith(StoragePatterns.DELETE_FILES, {
      keys: ownedSnap.snaps,
    });
    expect(snapModel.deleteOne).toHaveBeenCalledWith({ _id: 's1' });
  });

  it('lets an admin delete another user snap', async () => {
    await service.deleteSnap('s1', { userId: 'admin', role: ROLES.ADMIN });
    expect(natsClient.send).toHaveBeenCalledWith(StoragePatterns.DELETE_FILES, {
      keys: ownedSnap.snaps,
    });
    expect(snapModel.deleteOne).toHaveBeenCalled();
  });

  it('deletes storage keys before wiping all snaps', async () => {
    const result = await service.deleteAll();
    expect(natsClient.send).toHaveBeenCalledWith(StoragePatterns.DELETE_FILES, {
      keys: ['snaps/a.jpg', 'snaps/b.jpg'],
    });
    expect(snapModel.deleteMany).toHaveBeenCalledWith({});
    expect(result).toEqual({ deletedCount: 2 });
  });

  it("deletes a user's snaps and their storage keys", async () => {
    const result = await service.deleteByUserId('owner');
    expect(snapModel.find).toHaveBeenCalledWith({ _userId: 'owner' });
    expect(natsClient.send).toHaveBeenCalledWith(StoragePatterns.DELETE_FILES, {
      keys: ['snaps/a.jpg', 'snaps/b.jpg'],
    });
    expect(snapModel.deleteMany).toHaveBeenCalledWith({ _userId: 'owner' });
    expect(result).toEqual({ deletedCount: 2 });
  });
});
