import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  AuthPatterns,
  ProblemCodes,
  SnapsPatterns,
  UsersPatterns,
} from 'contracts';
import { AccountDeleteOrchestrator } from './account-delete.orchestrator';
import { GatewayRpcClient } from './rpc/gateway-rpc.client';

describe('AccountDeleteOrchestrator', () => {
  let orchestrator: AccountDeleteOrchestrator;
  let rpc: { request: jest.Mock };

  beforeEach(async () => {
    rpc = { request: jest.fn().mockResolvedValue({ success: true }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountDeleteOrchestrator,
        { provide: GatewayRpcClient, useValue: rpc },
      ],
    }).compile();

    orchestrator = module.get(AccountDeleteOrchestrator);
  });

  it('deactivates auth, then snaps, users, then credentials in order', async () => {
    await expect(
      orchestrator.deleteAccount('u1', 'Password123!'),
    ).resolves.toEqual({ success: true });

    const calls = rpc.request.mock.calls as Array<[string, unknown]>;
    expect(calls.map((call) => call[0])).toEqual([
      AuthPatterns.DEACTIVATE_USER,
      SnapsPatterns.DELETE_BY_USER_ID,
      UsersPatterns.PURGE_USER,
      AuthPatterns.DELETE_CREDENTIALS,
    ]);
    expect(calls[0][1]).toEqual({
      userId: 'u1',
      password: 'Password123!',
    });
  });

  it('keeps the account disabled with ACCOUNT_DELETE_INCOMPLETE if a later step fails', async () => {
    rpc.request.mockImplementation((pattern: string) => {
      if (pattern === UsersPatterns.PURGE_USER) {
        return Promise.reject(new Error('users down'));
      }
      return Promise.resolve({ success: true });
    });

    try {
      await orchestrator.deleteAccount('u1', 'Password123!');
      throw new Error('expected deleteAccount to reject');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      const exception = err as HttpException;
      expect(exception.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(exception.getResponse()).toEqual(
        expect.objectContaining({
          code: ProblemCodes.ACCOUNT_DELETE_INCOMPLETE,
        }),
      );
    }

    const calls = rpc.request.mock.calls as Array<[string, unknown]>;
    expect(calls.map((call) => call[0])).toEqual([
      AuthPatterns.DEACTIVATE_USER,
      SnapsPatterns.DELETE_BY_USER_ID,
      UsersPatterns.PURGE_USER,
    ]);
  });

  it('propagates deactivate failures without wrapping as incomplete', async () => {
    rpc.request.mockRejectedValueOnce(
      new HttpException('Invalid email or password', HttpStatus.UNAUTHORIZED),
    );

    await expect(
      orchestrator.deleteAccount('u1', 'wrong'),
    ).rejects.toBeInstanceOf(HttpException);
    expect(rpc.request).toHaveBeenCalledTimes(1);
    expect(rpc.request).toHaveBeenCalledWith(
      AuthPatterns.DEACTIVATE_USER,
      { userId: 'u1', password: 'wrong' },
      expect.any(Number),
    );
  });
});
