import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AccountDeleteOrchestrator } from './account-delete.orchestrator';
import { GatewayAuthController } from './controllers/gateway-auth.controller';
import { GatewaySnapsController } from './controllers/gateway-snaps.controller';
import { GatewayStorageController } from './controllers/gateway-storage.controller';
import { GatewayUsersController } from './controllers/gateway-users.controller';
import { GatewayAuthGuard } from './guards/auth.guard';
import { GatewayRpcClient } from './rpc/gateway-rpc.client';
import { createGatewayOpenApiDocument } from './swagger';

describe('Gateway OpenAPI', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [
        GatewayAuthController,
        GatewayUsersController,
        GatewaySnapsController,
        GatewayStorageController,
      ],
      providers: [
        AccountDeleteOrchestrator,
        GatewayAuthGuard,
        { provide: GatewayRpcClient, useValue: { request: jest.fn() } },
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents P0–P4 gateway HTTP routes and bearer auth', () => {
    const document = createGatewayOpenApiDocument(app);
    const paths = document.paths ?? {};

    const required = [
      ['/auth/login', 'post'],
      ['/auth/signup', 'post'],
      ['/auth/forgot-password', 'post'],
      ['/auth/reset-password', 'post'],
      ['/auth/me', 'get'],
      ['/users/settings', 'put'],
      ['/users/me', 'patch'],
      ['/users/me/export', 'get'],
      ['/users/me', 'delete'],
      ['/users/me/password', 'post'],
      ['/users/me/bookmarks', 'get'],
      ['/users/me/bookmarks/{snapId}', 'put'],
      ['/users/me/bookmarks/{snapId}', 'delete'],
      ['/users/image', 'put'],
      ['/snaps/me', 'get'],
      ['/snaps/{id}', 'delete'],
      ['/snaps/{id}/found', 'post'],
      ['/snaps/{id}/reopen', 'post'],
      ['/snaps/{id}/report', 'post'],
      ['/snaps', 'post'],
      ['/storage/presigned-upload', 'post'],
    ] as const;

    for (const [path, method] of required) {
      const operation = paths[path]?.[method];
      expect(operation).toBeDefined();
      expect(operation?.operationId || operation?.summary).toBeTruthy();
    }

    const authed = [
      paths['/snaps/me']?.get,
      paths['/users/me/export']?.get,
      paths['/users/me']?.delete,
      paths['/storage/presigned-upload']?.post,
    ];
    for (const operation of authed) {
      expect(operation?.security?.length).toBeGreaterThan(0);
    }

    expect(paths['/auth/signup']?.post?.security ?? []).toEqual([]);
    expect(paths['/auth/forgot-password']?.post?.security ?? []).toEqual([]);
  });
});
