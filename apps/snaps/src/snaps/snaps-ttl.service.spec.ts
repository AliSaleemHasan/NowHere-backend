import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { of } from 'rxjs';
import { StoragePatterns } from 'contracts';
import { NATS_CLIENT } from 'nowhere-common';
import { Snap } from './schemas/snap.schema';
import { SnapsTtlService, TTL_INTERVAL_MS } from './snaps-ttl.service';

describe('SnapsTtlService', () => {
  let service: SnapsTtlService;
  let limit: jest.Mock;
  let snapModel: {
    find: jest.Mock;
    deleteMany: jest.Mock;
  };
  let natsClient: { send: jest.Mock };

  beforeEach(async () => {
    limit = jest.fn().mockReturnThis();
    snapModel = {
      find: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        limit,
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          { _id: 's1', snaps: ['snaps/a.jpg', 'snaps/b.jpg'] },
          { _id: 's2', snaps: ['snaps/b.jpg'] },
        ]),
      }),
      deleteMany: jest.fn().mockResolvedValue({ deletedCount: 2 }),
    };
    natsClient = { send: jest.fn().mockReturnValue(of(undefined)) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SnapsTtlService,
        { provide: getModelToken(Snap.name), useValue: snapModel },
        { provide: NATS_CLIENT, useValue: natsClient },
      ],
    }).compile();

    service = module.get(SnapsTtlService);
  });

  it('runs on a 15-minute interval, not 5 minutes', () => {
    expect(TTL_INTERVAL_MS).toBe(15 * 60 * 1000);
    expect(TTL_INTERVAL_MS).not.toBe(5 * 60 * 1000);
  });

  it('deletes a batch of expired snaps and calls storage', async () => {
    const deleted = await service.sweepExpired();

    expect(deleted).toBe(2);
    const findCalls = snapModel.find.mock.calls as unknown as Array<
      [{ expiresAt: { $lte: Date } }]
    >;
    expect(findCalls[0][0].expiresAt.$lte).toBeInstanceOf(Date);
    expect(limit).toHaveBeenCalledWith(100);
    expect(natsClient.send).toHaveBeenCalledWith(StoragePatterns.DELETE_FILES, {
      keys: ['snaps/a.jpg', 'snaps/b.jpg'],
    });
    expect(snapModel.deleteMany).toHaveBeenCalledWith({
      _id: { $in: ['s1', 's2'] },
    });
  });

  it('skips storage when the batch is empty', async () => {
    snapModel.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      limit,
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    });

    const deleted = await service.sweepExpired();

    expect(deleted).toBe(0);
    expect(natsClient.send).not.toHaveBeenCalled();
    expect(snapModel.deleteMany).not.toHaveBeenCalled();
  });
});
