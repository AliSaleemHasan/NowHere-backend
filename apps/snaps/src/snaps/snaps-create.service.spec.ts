import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { of } from 'rxjs';
import { CreateSnapPayload, UsersPatterns } from 'contracts';
import { NATS_CLIENT } from 'nowhere-common';
import { Snap } from './schemas/snap.schema';
import { SnapsGateway } from './gateway';
import { SnapsCreateService } from './snaps-create.service';
import { SnapsNearParamsService } from './snaps-near-params';

const IDEMPOTENCY_KEY = '11111111-1111-4111-8111-111111111111';

const payload: CreateSnapPayload = {
  userId: 'u1',
  description: 'hello',
  location: { type: 'Point', coordinates: [13.4, 52.5] },
  snaps: ['snaps/2026-09-03/u1/a.jpg'],
};

describe('SnapsCreateService', () => {
  let service: SnapsCreateService;
  let save: jest.Mock;
  let findOneExec: jest.Mock;
  let natsClient: { send: jest.Mock };
  let handleNewSnap: jest.Mock;

  beforeEach(async () => {
    save = jest.fn();
    findOneExec = jest.fn().mockResolvedValue(null);

    function SnapModel(
      this: Record<string, unknown>,
      doc: Record<string, unknown>,
    ) {
      Object.assign(this, doc);
      this.save = save;
      this.toJSON = () => ({ id: 'snap-1', ...doc });
    }
    save.mockImplementation(async function (this: {
      toJSON: () => Record<string, unknown>;
    }) {
      return this;
    });
    (SnapModel as unknown as { findOne: jest.Mock }).findOne = jest
      .fn()
      .mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: findOneExec,
      });

    natsClient = {
      send: jest.fn().mockImplementation((pattern: string) => {
        if (pattern === UsersPatterns.GET_SETTINGS) {
          return of({
            maxDistance: 5000,
            newSnapDistance: 1000,
            snapDisappearTime: 1,
          });
        }
        return of({});
      }),
    };
    handleNewSnap = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SnapsCreateService,
        SnapsNearParamsService,
        { provide: getModelToken(Snap.name), useValue: SnapModel },
        { provide: NATS_CLIENT, useValue: natsClient },
        { provide: SnapsGateway, useValue: { handleNewSnap } },
      ],
    }).compile();

    service = module.get(SnapsCreateService);
  });

  it('writes expiresAt from the author disappear days', async () => {
    const before = Date.now();
    const created = await service.create('u1', payload);
    const after = Date.now();

    expect(created.expiresAt).toBeInstanceOf(Date);
    const expiresAt = (created.expiresAt as Date).getTime();
    expect(expiresAt).toBeGreaterThanOrEqual(before + 24 * 60 * 60 * 1000);
    expect(expiresAt).toBeLessThanOrEqual(after + 24 * 60 * 60 * 1000);
    expect(handleNewSnap).toHaveBeenCalled();
  });

  it('returns the existing snap when the same idempotencyKey is reused', async () => {
    const existing = {
      id: 'existing-snap',
      _userId: 'u1',
      idempotencyKey: IDEMPOTENCY_KEY,
      toJSON() {
        return this;
      },
    };
    findOneExec.mockResolvedValueOnce(null).mockResolvedValueOnce(existing);
    const dup = Object.assign(new Error('E11000 duplicate key'), {
      code: 11000,
      keyPattern: { _userId: 1, idempotencyKey: 1 },
      keyValue: { _userId: 'u1', idempotencyKey: IDEMPOTENCY_KEY },
    });
    save.mockRejectedValue(dup);

    const result = await service.create('u1', {
      ...payload,
      idempotencyKey: IDEMPOTENCY_KEY,
    });

    expect(result).toEqual(existing);
  });
});
