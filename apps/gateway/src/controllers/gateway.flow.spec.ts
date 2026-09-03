import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { GatewayAuthController } from './gateway-auth.controller';
import { GatewaySnapsController } from './gateway-snaps.controller';
import { GatewayStorageController } from './gateway-storage.controller';
import { AuthPatterns, SnapsPatterns, StoragePatterns, ROLES } from 'contracts';
import { CreateSnapHttpDto } from '../dto/create-snap.dto';
import { GeoPointType, Tags } from 'nowhere-common/types/common-types';

describe('Gateway product flow (mocked NATS)', () => {
  let auth: GatewayAuthController;
  let snaps: GatewaySnapsController;
  let storage: GatewayStorageController;
  let send: jest.Mock;

  beforeEach(async () => {
    send = jest.fn().mockImplementation((pattern: string) => {
      if (pattern === AuthPatterns.SIGNUP || pattern === AuthPatterns.VALIDATE_USER) {
        return of({
          user: { id: 'u1', email: 'a@a.com', role: ROLES.USER, isActive: true },
          tokens: { accessToken: 'a', refreshToken: 'r' },
        });
      }
      if (pattern === StoragePatterns.GET_PRESIGNED_UPLOAD) {
        return of({ uploadUrl: 'https://upload', key: 'snaps/2026-09-03/u1/x.jpg' });
      }
      if (pattern === SnapsPatterns.CREATE) {
        return of({ id: 'snap-1', _userId: 'u1' });
      }
      if (pattern === SnapsPatterns.FIND_NEAR) {
        return of([{ id: 'snap-other', _userId: 'u2' }]);
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
        { provide: 'NATS_CLIENT', useValue: { send } },
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

    const login = await auth.login({ email: 'a@a.com', password: 'Password123!' });
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
});
