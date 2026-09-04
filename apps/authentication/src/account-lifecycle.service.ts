import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { DeactivateUserPayload, DeleteCredentialsPayload } from 'contracts';
import { Repository } from 'typeorm';
import { GENERIC_CREDENTIALS_ERROR } from './auth-errors';
import { Credential } from './entities/user-credentials-entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';

@Injectable()
export class AccountLifecycleService {
  constructor(
    @InjectRepository(Credential)
    private readonly credentials: Repository<Credential>,
    @InjectRepository(PasswordResetToken)
    private readonly tokens: Repository<PasswordResetToken>,
  ) {}

  async deactivateUser(
    payload: DeactivateUserPayload,
  ): Promise<{ success: true }> {
    const user = await this.credentials.findOneBy({ id: payload.userId });
    if (!user) {
      // Last-step delete may have succeeded while the NATS reply timed out.
      return { success: true };
    }

    const passwordMatches = await bcrypt.compare(
      payload.password,
      user.password,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException(GENERIC_CREDENTIALS_ERROR);
    }

    if (user.isActive) {
      await this.credentials.save({ ...user, isActive: false });
    }

    return { success: true };
  }

  async deleteCredentials(
    payload: DeleteCredentialsPayload,
  ): Promise<{ success: true }> {
    await this.tokens.delete({ userId: payload.userId });
    await this.credentials.delete({ id: payload.userId });
    return { success: true };
  }
}
