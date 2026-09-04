import { ForbiddenException } from '@nestjs/common';
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
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const payload: CreateSnapPayload = {
  userId: 'u1',
  description: 'hello',
  location: { type: 'Point', coordinates: [13.4, 52.5] },
  snaps: ['snaps/2026-09-03/u1/a.jpg'],
};

describe('SnapsCreateService', () => {
  let service: SnapsCreateService;
  let save: jest.Mock;
  let findOne: jest.Mock;
  let natsClient: { send: jest.Mock };
  let handleNewSnap: jest.Mock;

  function existingSnap(overrides: Record<string, unknown> = {}) {
    const doc = {
      id: 'existing-snap',
      _userId: 'u1',
      idempotencyKey: IDEMPOTENCY_KEY,
      ...overrides,
    };
    return {
      ...doc,
      toJSON() {
        return doc;
      },
    };
  }

  function mockFindOne(resolve: (query: Record<string, unknown>) => unknown) {
    findOne.mockImplementation((query: Record<string, unknown> = {}) => ({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(resolve(query)),
    }));
  }

  beforeEach(async () => {
    save = jest.fn();
    findOne = jest.fn();
    mockFindOne(() => null);

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
    (SnapModel as unknown as { findOne: jest.Mock }).findOne = findOne;

    natsClient = {
      send: jest.fn().mockImplementation((pattern: string) => {
        if (pattern === UsersPatterns.GET_SETTINGS) {
          return of({
            maxDistance: 5000,
            newSnapDistance: 1000,
            snapDisappearTime: 3,
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

    expect(natsClient.send).toHaveBeenCalledWith(UsersPatterns.GET_SETTINGS, {
      id: 'u1',
    });
    expect(created.expiresAt).toBeInstanceOf(Date);
    const expiresAt = (created.expiresAt as Date).getTime();
    expect(expiresAt).toBeGreaterThanOrEqual(before + 3 * MS_PER_DAY);
    expect(expiresAt).toBeLessThanOrEqual(after + 3 * MS_PER_DAY);
    expect(handleNewSnap).toHaveBeenCalled();
  });

  it('returns the existing snap when the same idempotencyKey is looked up first', async () => {
    const existing = existingSnap();
    mockFindOne((query) =>
      query.idempotencyKey === IDEMPOTENCY_KEY ? existing : null,
    );

    const result = await service.create('u1', {
      ...payload,
      idempotencyKey: IDEMPOTENCY_KEY,
    });

    expect(result).toEqual({
      id: 'existing-snap',
      _userId: 'u1',
      idempotencyKey: IDEMPOTENCY_KEY,
    });
    expect(save).not.toHaveBeenCalled();
    expect(handleNewSnap).not.toHaveBeenCalled();
  });

  it('returns the geo hit when it is the same idempotencyKey', async () => {
    const existing = existingSnap();
    mockFindOne((query) => {
      if (query.idempotencyKey) return null;
      if (query.location) return existing;
      return null;
    });

    const result = await service.create('u1', {
      ...payload,
      idempotencyKey: IDEMPOTENCY_KEY,
    });

    expect(result).toEqual({
      id: 'existing-snap',
      _userId: 'u1',
      idempotencyKey: IDEMPOTENCY_KEY,
    });
    expect(save).not.toHaveBeenCalled();
  });

  it('forbids a different active snap in the same area', async () => {
    mockFindOne((query) => {
      if (query.idempotencyKey) return null;
      if (query.location) {
        return existingSnap({
          id: 'other-snap',
          idempotencyKey: '22222222-2222-4222-8222-222222222222',
        });
      }
      return null;
    });

    await expect(
      service.create('u1', { ...payload, idempotencyKey: IDEMPOTENCY_KEY }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(save).not.toHaveBeenCalled();
  });

  it('returns the existing snap on a duplicate-key race', async () => {
    const existing = existingSnap();
    const keyLookups = [null, existing];
    mockFindOne((query) => {
      if (query.idempotencyKey) return keyLookups.shift() ?? null;
      return null;
    });
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

    expect(result).toEqual({
      id: 'existing-snap',
      _userId: 'u1',
      idempotencyKey: IDEMPOTENCY_KEY,
    });
  });
});
