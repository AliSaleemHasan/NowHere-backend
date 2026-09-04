import {
  CanActivate,
  ExecutionContext,
  INestApplication,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AuthPatterns, SnapsPatterns, UsersPatterns } from 'contracts';
import { createValidationPipe } from 'nowhere-common';
import { AccountDeleteOrchestrator } from '../account-delete.orchestrator';
import { GatewayRpcClient } from '../rpc/gateway-rpc.client';
import { GatewayAuthGuard } from '../guards/auth.guard';
import { GatewayUsersController } from './gateway-users.controller';

class AllowAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{
      user: { id: string; email: string; role: string };
    }>();
    req.user = { id: 'u1', email: 'a@a.com', role: 'USER' };
    return true;
  }
}

describe('GatewayUsersController', () => {
  let app: INestApplication;
  let rpc: { request: jest.Mock };

  beforeEach(async () => {
    rpc = { request: jest.fn().mockResolvedValue({ ok: true }) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GatewayUsersController],
      providers: [
        AccountDeleteOrchestrator,
        { provide: GatewayRpcClient, useValue: rpc },
      ],
    })
      .overrideGuard(GatewayAuthGuard)
      .useClass(AllowAuthGuard)
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(createValidationPipe());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer() as Parameters<typeof request>[0];

  it('rejects out-of-enum settings values with 400', async () => {
    await request(server())
      .put('/users/settings')
      .send({
        maxDistance: 123,
        newSnapDistance: 250,
        snapDisappearTime: 1,
      })
      .expect(400);
    expect(rpc.request).not.toHaveBeenCalled();
  });

  it('maps profile patch, settings put, and password change to RPC', async () => {
    await request(server())
      .patch('/users/me')
      .send({ firstName: 'Ada', lastName: 'Lovelace', bio: 'notes' })
      .expect(200)
      .expect({ ok: true });
    expect(rpc.request).toHaveBeenCalledWith(UsersPatterns.UPDATE_PROFILE, {
      userId: 'u1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      bio: 'notes',
    });

    rpc.request.mockClear();
    await request(server())
      .put('/users/settings')
      .send({
        maxDistance: 5000,
        newSnapDistance: 500,
        snapDisappearTime: 3,
      })
      .expect(200);
    expect(rpc.request).toHaveBeenCalledWith(UsersPatterns.UPDATE_SETTINGS, {
      userId: 'u1',
      maxDistance: 5000,
      newSnapDistance: 500,
      snapDisappearTime: 3,
    });

    rpc.request.mockClear();
    await request(server())
      .post('/users/me/password')
      .send({
        currentPassword: 'Password123!',
        newPassword: 'Password456!',
      })
      .expect(201);
    expect(rpc.request).toHaveBeenCalledWith(AuthPatterns.CHANGE_PASSWORD, {
      userId: 'u1',
      currentPassword: 'Password123!',
      newPassword: 'Password456!',
    });
  });

  it('maps GET /users/me/export to users.exportUser', async () => {
    rpc.request.mockResolvedValueOnce({
      exportedAt: '2026-09-04T00:00:00.000Z',
      user: { id: 'u1' },
      settings: { maxDistance: 5000 },
      snaps: [{ snaps: ['snaps/u1/a.jpg'] }],
    });

    await request(server()).get('/users/me/export').expect(200);
    expect(rpc.request).toHaveBeenCalledWith(UsersPatterns.EXPORT_USER, {
      userId: 'u1',
    });
  });

  it('deletes the account by calling snaps then users then auth in order', async () => {
    await request(server())
      .delete('/users/me')
      .send({ password: 'Password123!' })
      .expect(200);

    const calls = rpc.request.mock.calls as Array<[string, unknown]>;
    expect(calls.map((call) => call[0])).toEqual([
      AuthPatterns.DEACTIVATE_USER,
      SnapsPatterns.DELETE_BY_USER_ID,
      UsersPatterns.PURGE_USER,
      AuthPatterns.DELETE_CREDENTIALS,
    ]);
  });
});
