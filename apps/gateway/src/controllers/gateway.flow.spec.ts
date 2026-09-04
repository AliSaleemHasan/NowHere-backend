import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { GatewayAuthController } from './gateway-auth.controller';
import { GatewaySnapsController } from './gateway-snaps.controller';
import { GatewayStorageController } from './gateway-storage.controller';
import { AuthPatterns, SnapsPatterns, StoragePatterns, ROLES } from 'contracts';
import { CreateSnapHttpDto } from '../dto/create-snap.dto';
import {
  GeoPointType,
  NATS_CLIENT,
  RoleGuard,
  Tags,
  UserRoles,
} from 'nowhere-common';
import { GatewayRpcClient } from '../rpc/gateway-rpc.client';
import { GatewayAuthGuard } from '../guards/auth.guard';

describe('Gateway product flow (mocked NATS)', () => {
  let auth: GatewayAuthController;
  let snaps: GatewaySnapsController;
  let storage: GatewayStorageController;
  let send: jest.Mock;

  beforeEach(async () => {
    send = jest.fn().mockImplementation((pattern: string) => {
      if (
        pattern === AuthPatterns.SIGNUP ||
        pattern === AuthPatterns.VALIDATE_USER
      ) {
        return of({
          user: {
            id: 'u1',
            email: 'a@a.com',
            role: ROLES.USER,
            isActive: true,
          },
          tokens: { accessToken: 'a', refreshToken: 'r' },
        });
      }
      if (pattern === StoragePatterns.GET_PRESIGNED_UPLOAD) {
        return of({
          uploadUrl: 'https://upload',
          key: 'snaps/2026-09-03/u1/x.jpg',
        });
      }
      if (pattern === SnapsPatterns.CREATE) {
        return of({ id: 'snap-1', _userId: 'u1' });
      }
      if (pattern === SnapsPatterns.FIND_NEAR) {
        return of([{ id: 'snap-other', _userId: 'u2' }]);
      }
      if (pattern === SnapsPatterns.FIND_BY_USER) {
        return of([{ id: 'snap-1', _userId: 'u1' }]);
      }
      if (pattern === SnapsPatterns.DELETE_ONE) {
        return of({ deletedCount: 1 });
      }
      return of({});
    });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [
        GatewayAuthController,
        GatewaySnapsController,
        GatewayStorageController,
      ],
      providers: [
        GatewayRpcClient,
        { provide: NATS_CLIENT, useValue: { send } },
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    auth = module.get(GatewayAuthController);
    snaps = module.get(GatewaySnapsController);
    storage = module.get(GatewayStorageController);
  });

  it('signup → login → presign → create snap → nearby', async () => {
    const signup = await auth.signup({
      email: 'a@a.com',
      password: 'Password123!',
      firstName: 'A',
      lastName: 'A',
    });
    expect(signup.tokens.accessToken).toBe('a');

    const login = await auth.login({
      email: 'a@a.com',
      password: 'Password123!',
    });
    expect(login.user.id).toBe('u1');

    const presign = await storage.getPresignedUploadURL('u1', {
      filename: 'photo.jpg',
      contentType: 'image/jpeg',
      prefix: 'snaps',
    });
    expect(presign).toEqual({
      uploadUrl: 'https://upload',
      key: 'snaps/2026-09-03/u1/x.jpg',
    });

    const created = (await snaps.create('u1', {
      description: 'hello',
      location: { type: GeoPointType.Point, coordinates: [13.4, 52.5] },
      snaps: ['snaps/2026-09-03/u1/x.jpg'],
      tag: Tags.SOCIAL,
    } as CreateSnapHttpDto)) as { id: string };
    expect(created.id).toBe('snap-1');

    const nearby = (await snaps.findNear('u1', '13.4', '52.5')) as Array<{
      _userId: string;
    }>;
    expect(nearby[0]._userId).toBe('u2');
  });

  it('lists current user snaps and forwards actor on delete', async () => {
    const mine = (await snaps.findMine('u1')) as Array<{ id: string }>;
    expect(mine[0].id).toBe('snap-1');
    expect(send).toHaveBeenCalledWith(SnapsPatterns.FIND_BY_USER, {
      userId: 'u1',
      includeExpired: true,
    });

    await snaps.findMine('u1', '0');
    expect(send).toHaveBeenCalledWith(SnapsPatterns.FIND_BY_USER, {
      userId: 'u1',
      includeExpired: false,
    });

    await snaps.deleteOne('u1', ROLES.USER, 'snap-1');
    expect(send).toHaveBeenCalledWith(SnapsPatterns.DELETE_ONE, {
      id: 'snap-1',
      userId: 'u1',
      role: ROLES.USER,
    });
  });

  it('DELETE /snaps/:id requires auth but not admin', () => {
    const handler = controllerHandler(GatewaySnapsController, 'deleteOne');
    expect(handlerGuards(handler)).toEqual([GatewayAuthGuard]);
    expect(handlerRoles(handler)).toBeUndefined();
  });

  it('DELETE /snaps (deleteAll) stays admin-only', () => {
    const handler = controllerHandler(GatewaySnapsController, 'deleteAll');
    expect(handlerGuards(handler)).toEqual([GatewayAuthGuard, RoleGuard]);
    expect(handlerRoles(handler)).toEqual([ROLES.ADMIN]);
  });

  it('forwards optional idempotencyKey on create', async () => {
    const key = '11111111-1111-4111-8111-111111111111';
    await snaps.create('u1', {
      description: 'hello',
      location: { type: GeoPointType.Point, coordinates: [13.4, 52.5] },
      snaps: ['snaps/2026-09-03/u1/x.jpg'],
      tag: Tags.SOCIAL,
      idempotencyKey: key,
    } as CreateSnapHttpDto);
    expect(send).toHaveBeenCalledWith(
      SnapsPatterns.CREATE,
      expect.objectContaining({ idempotencyKey: key, userId: 'u1' }),
    );
  });
});

type RouteHandler = (...args: never[]) => unknown;

function controllerHandler(
  Controller: { prototype: object },
  name: string,
): RouteHandler {
  const handler: unknown = Reflect.get(Controller.prototype, name);
  if (typeof handler !== 'function') {
    throw new Error(`Missing handler ${name}`);
  }
  return handler as RouteHandler;
}

function handlerGuards(handler: RouteHandler): unknown[] {
  const guards: unknown = Reflect.getMetadata(GUARDS_METADATA, handler);
  return Array.isArray(guards) ? guards : [];
}

function handlerRoles(handler: RouteHandler): ROLES[] | undefined {
  const roles: unknown = Reflect.getMetadata(UserRoles.KEY, handler);
  return Array.isArray(roles) ? (roles as ROLES[]) : undefined;
}
