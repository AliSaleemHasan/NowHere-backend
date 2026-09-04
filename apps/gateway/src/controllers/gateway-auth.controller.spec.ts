import {
  CanActivate,
  ExecutionContext,
  INestApplication,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AuthPatterns } from 'contracts';
import { createValidationPipe } from 'nowhere-common';
import { GatewayRpcClient } from '../rpc/gateway-rpc.client';
import { GatewayAuthGuard } from '../guards/auth.guard';
import { GatewayAuthController } from './gateway-auth.controller';

class AllowAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{
      user: { id: string; email: string; role: string };
    }>();
    req.user = { id: 'u1', email: 'a@a.com', role: 'USER' };
    return true;
  }
}

describe('GatewayAuthController', () => {
  let app: INestApplication;
  let rpc: { request: jest.Mock };

  beforeEach(async () => {
    rpc = { request: jest.fn().mockResolvedValue({ accepted: true }) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GatewayAuthController],
      providers: [{ provide: GatewayRpcClient, useValue: rpc }],
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

  it('returns 202 for forgot-password even when the email is unknown', async () => {
    await request(app.getHttpServer() as Parameters<typeof request>[0])
      .post('/auth/forgot-password')
      .send({ email: 'missing@a.com' })
      .expect(202)
      .expect({ accepted: true });

    expect(rpc.request).toHaveBeenCalledWith(AuthPatterns.FORGOT_PASSWORD, {
      email: 'missing@a.com',
    });
  });

  it('maps reset-password to auth.resetPassword', async () => {
    rpc.request.mockResolvedValueOnce({ success: true });
    await request(app.getHttpServer() as Parameters<typeof request>[0])
      .post('/auth/reset-password')
      .send({ token: 'abc', newPassword: 'Password123!' })
      .expect(200)
      .expect({ success: true });
    expect(rpc.request).toHaveBeenCalledWith(AuthPatterns.RESET_PASSWORD, {
      token: 'abc',
      newPassword: 'Password123!',
    });
  });
});
