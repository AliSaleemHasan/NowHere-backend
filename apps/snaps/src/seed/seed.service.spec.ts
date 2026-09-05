import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { of, throwError } from 'rxjs';
import { AuthPatterns, UsersPatterns } from 'contracts';
import { NATS_CLIENT } from 'nowhere-common';
import { Snap } from '../snaps/schemas/snap.schema';
import { SeedService } from './seed.service';

describe('SeedService', () => {
  let service: SeedService;
  let send: jest.Mock;
  let snapsModel: {
    deleteMany: jest.Mock;
    insertMany: jest.Mock;
  };

  beforeEach(async () => {
    send = jest.fn();
    snapsModel = {
      deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
      insertMany: jest.fn().mockResolvedValue(new Array(20).fill({})),
    };

    const module = await Test.createTestingModule({
      providers: [
        SeedService,
        { provide: getModelToken(Snap.name), useValue: snapsModel },
        { provide: NATS_CLIENT, useValue: { send, emit: jest.fn() } },
      ],
    }).compile();

    service = module.get(SeedService);
  });

  it('replaces previous demo snaps instead of skipping', async () => {
    snapsModel.deleteMany.mockResolvedValue({ deletedCount: 321 });
    send.mockImplementation((pattern: string, payload: { email?: string }) => {
      if (pattern === AuthPatterns.SIGNUP) {
        return of({
          user: { id: `id-${payload.email}`, email: payload.email },
          tokens: { accessToken: 'a', refreshToken: 'r' },
        });
      }
      return of({});
    });

    const result = await service.seed();
    expect(result).toEqual({ skipped: false, users: 8, snaps: 20 });
    expect(snapsModel.deleteMany).toHaveBeenCalled();
    expect(snapsModel.insertMany).toHaveBeenCalled();
  });

  it('signs up a handful of users and insertMany-s SUCCESS snaps', async () => {
    send.mockImplementation((pattern: string, payload: { email?: string }) => {
      if (pattern === AuthPatterns.SIGNUP) {
        return of({
          user: { id: `id-${payload.email}`, email: payload.email },
          tokens: { accessToken: 'a', refreshToken: 'r' },
        });
      }
      return of({});
    });

    const result = await service.seed();
    expect(result.skipped).toBe(false);
    expect(result.users).toBe(8);
    expect(result.snaps).toBe(20);
    expect(send).toHaveBeenCalledTimes(8);
    const inserted = snapsModel.insertMany.mock.calls[0][0] as Array<{
      status: string;
      description: string;
    }>;
    expect(inserted).toHaveLength(20);
    expect(inserted.every((doc) => doc.status === 'SUCCESS')).toBe(true);
    expect(inserted[0].description).toContain('[nowhere-seed]');
  });

  it('loads an existing user when signup conflicts', async () => {
    send.mockImplementation((pattern: string) => {
      if (pattern === AuthPatterns.SIGNUP) {
        return throwError(() => new Error('Email already in use'));
      }
      if (pattern === UsersPatterns.GET_USER_BY_EMAIL) {
        return of({ id: 'existing-1', email: 'seed.user.0@nowhere.test' });
      }
      return of({});
    });

    const result = await service.seed();
    expect(result.users).toBe(8);
    expect(snapsModel.insertMany).toHaveBeenCalled();
  });
});
