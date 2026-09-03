import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { of } from 'rxjs';
import { SnapsService } from './snaps.service';
import { Snap, SnapStatus } from './schemas/snap.schema';
import { SnapsGateway } from './gateway';
import { UsersPatterns } from 'contracts';
import { NATS_CLIENT } from 'nowhere-common';

describe('SnapsService', () => {
  let service: SnapsService;
  let snapModel: {
    find: jest.Mock;
    findOne: jest.Mock;
    findById: jest.Mock;
  };
  let natsClient: { send: jest.Mock };

  const callerSnap = {
    id: 'snap-caller',
    _userId: 'caller',
    status: SnapStatus.SUCCESS,
  };
  const otherSnap = {
    id: 'snap-other',
    _userId: 'other-user',
    status: SnapStatus.SUCCESS,
  };

  beforeEach(async () => {
    const exec = jest.fn().mockResolvedValue([callerSnap, otherSnap]);
    snapModel = {
      find: jest.fn().mockReturnValue({ exec }),
      findOne: jest.fn(),
      findById: jest.fn(),
    };

    natsClient = {
      send: jest.fn().mockImplementation((pattern: string) => {
        if (pattern === UsersPatterns.GET_SETTINGS) {
          return of({
            maxDistance: 5000,
            newSnapDistance: 1000,
            snapDisappearTime: 1,
          });
        }
        if (pattern === UsersPatterns.NOT_SEEN_SNAPS) {
          return of({ seen: [] });
        }
        return of({});
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SnapsService,
        { provide: getModelToken(Snap.name), useValue: snapModel },
        { provide: NATS_CLIENT, useValue: natsClient },
        {
          provide: SnapsGateway,
          useValue: { handleNewSnap: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(SnapsService);
  });

  it('findNear queries all successful snaps, not only the caller', async () => {
    await service.findNear({
      location: [13.4, 52.5],
      tags: [],
      _userId: 'caller',
    });

    expect(snapModel.find).toHaveBeenCalled();
    const query = snapModel.find.mock.calls[0][0];
    expect(query.status).toBe(SnapStatus.SUCCESS);
    expect(query._userId).toBeUndefined();
  });

  it('nearby feed returns another user unseen snap near the same point', async () => {
    const result = await service.getSeenSnaps(
      { location: [13.4, 52.5], tags: [] } as any,
      'caller',
      false,
    );

    expect(result.map((snap) => snap.id)).toContain('snap-other');
    expect(
      natsClient.send.mock.calls.some(
        ([pattern, payload]) =>
          pattern === UsersPatterns.NOT_SEEN_SNAPS &&
          payload.userId === 'caller' &&
          payload.seen === true,
      ),
    ).toBe(true);
  });

  it('nearby feed hides snaps this user has already seen', async () => {
    natsClient.send.mockImplementation((pattern: string) => {
      if (pattern === UsersPatterns.GET_SETTINGS) {
        return of({
          maxDistance: 5000,
          newSnapDistance: 1000,
          snapDisappearTime: 1,
        });
      }
      if (pattern === UsersPatterns.NOT_SEEN_SNAPS) {
        return of({
          seen: [{ snapId: 'snap-other', userId: 'caller' }],
        });
      }
      return of({});
    });

    const unseen = await service.getSeenSnaps(
      { location: [13.4, 52.5], tags: [] } as any,
      'caller',
      false,
    );
    const seen = await service.getSeenSnaps(
      { location: [13.4, 52.5], tags: [] } as any,
      'caller',
      true,
    );

    expect(unseen.map((snap) => snap.id)).not.toContain('snap-other');
    expect(seen.map((snap) => snap.id)).toContain('snap-other');
  });
});
