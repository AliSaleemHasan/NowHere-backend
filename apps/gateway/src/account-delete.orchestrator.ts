import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  AuthPatterns,
  ProblemCodes,
  SnapsPatterns,
  UsersPatterns,
} from 'contracts';
import { throwHttpProblem } from 'nowhere-common';
import { GatewayRpcClient } from './rpc/gateway-rpc.client';

const ACCOUNT_DELETE_TIMEOUT_MS = 15_000;

@Injectable()
export class AccountDeleteOrchestrator {
  private readonly logger = new Logger(AccountDeleteOrchestrator.name);

  constructor(private readonly rpc: GatewayRpcClient) {}

  async deleteAccount(
    userId: string,
    password: string,
  ): Promise<{ success: true }> {
    await this.rpc.request(
      AuthPatterns.DEACTIVATE_USER,
      { userId, password },
      ACCOUNT_DELETE_TIMEOUT_MS,
    );

    try {
      await this.rpc.request(
        SnapsPatterns.DELETE_BY_USER_ID,
        { userId },
        ACCOUNT_DELETE_TIMEOUT_MS,
      );
      await this.rpc.request(
        UsersPatterns.PURGE_USER,
        { userId },
        ACCOUNT_DELETE_TIMEOUT_MS,
      );
      await this.rpc.request(
        AuthPatterns.DELETE_CREDENTIALS,
        { userId },
        ACCOUNT_DELETE_TIMEOUT_MS,
      );
    } catch (err) {
      this.logger.error(
        `Account delete incomplete for user ${userId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      throwHttpProblem(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Account deletion did not complete',
        ProblemCodes.ACCOUNT_DELETE_INCOMPLETE,
      );
    }

    return { success: true };
  }
}
