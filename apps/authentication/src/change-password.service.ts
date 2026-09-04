import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { ChangePasswordPayload } from 'contracts';
import { Repository } from 'typeorm';
import { GENERIC_CREDENTIALS_ERROR } from './auth-errors';
import { Credential } from './entities/user-credentials-entity';
import { hashPassword } from './hash-password';

@Injectable()
export class ChangePasswordService {
  constructor(
    @InjectRepository(Credential)
    private readonly credentials: Repository<Credential>,
  ) {}

  async changePassword(payload: ChangePasswordPayload) {
    const user = await this.credentials.findOneBy({ id: payload.userId });
    if (!user) {
      throw new UnauthorizedException(GENERIC_CREDENTIALS_ERROR);
    }

    const currentMatches = await bcrypt.compare(
      payload.currentPassword,
      user.password,
    );
    if (!currentMatches) {
      throw new UnauthorizedException(GENERIC_CREDENTIALS_ERROR);
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account is disabled');
    }

    await this.credentials.save({
      ...user,
      password: await hashPassword(payload.newPassword),
      failedLoginCount: 0,
      lockedUntil: null,
    });

    return { success: true };
  }
}
