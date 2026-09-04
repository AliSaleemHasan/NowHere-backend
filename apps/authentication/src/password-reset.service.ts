import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ForgotPasswordPayload,
  ForgotPasswordResult,
  ProblemCodes,
  ResetPasswordPayload,
} from 'contracts';
import { throwHttpProblem } from 'nowhere-common';
import { Repository } from 'typeorm';
import { Credential } from './entities/user-credentials-entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { hashPassword } from './hash-password';
import { SmtpMailer } from './smtp-mailer';
import { generateResetToken, hashResetToken } from './token-hash';

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    @InjectRepository(Credential)
    private readonly credentials: Repository<Credential>,
    @InjectRepository(PasswordResetToken)
    private readonly tokens: Repository<PasswordResetToken>,
    private readonly mailer: SmtpMailer,
    private readonly config: ConfigService,
  ) {}

  async forgotPassword(
    payload: ForgotPasswordPayload,
  ): Promise<ForgotPasswordResult> {
    const user = await this.credentials.findOneBy({ email: payload.email });
    if (!user) {
      return { accepted: true };
    }

    try {
      const rawToken = generateResetToken();
      const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
      await this.tokens.delete({ userId: user.id });
      await this.tokens.save(
        this.tokens.create({
          userId: user.id,
          tokenHash: hashResetToken(rawToken),
          expiresAt,
          usedAt: null,
        }),
      );

      const resetUrl = this.buildResetUrl(rawToken);
      let delivered = false;
      try {
        delivered = await this.mailer.sendPasswordReset(user.email, resetUrl);
      } catch (err) {
        this.logger.warn(
          `Failed to send password reset email: ${err instanceof Error ? err.message : err}`,
        );
      }

      const result: ForgotPasswordResult = { accepted: true };
      if (!delivered && this.config.get<string>('NODE_ENV') !== 'production') {
        result.devResetUrl = resetUrl;
      }
      return result;
    } catch (err) {
      this.logger.error(
        `Password reset persist failed: ${err instanceof Error ? err.message : err}`,
      );
      return { accepted: true };
    }
  }

  async resetPassword(
    payload: ResetPasswordPayload,
  ): Promise<{ success: true }> {
    const row = await this.tokens.findOneBy({
      tokenHash: hashResetToken(payload.token),
    });
    if (!row || row.usedAt || new Date(row.expiresAt).getTime() <= Date.now()) {
      this.throwInvalid();
    }

    const user = await this.credentials.findOneBy({ id: row.userId });
    if (!user) {
      this.throwInvalid();
    }

    await this.credentials.save({
      ...user,
      password: await hashPassword(payload.newPassword),
      failedLoginCount: 0,
      lockedUntil: null,
    });

    await this.tokens.save({
      ...row,
      usedAt: new Date(),
    });

    return { success: true };
  }

  private buildResetUrl(rawToken: string): string {
    const base =
      this.config.get<string>('PASSWORD_RESET_BASE_URL') ||
      'http://localhost:8081/reset-password';
    const separator = base.includes('?') ? '&' : '?';
    return `${base}${separator}token=${encodeURIComponent(rawToken)}`;
  }

  private throwInvalid(): never {
    throwHttpProblem(
      HttpStatus.BAD_REQUEST,
      'Password reset token is invalid',
      ProblemCodes.PASSWORD_RESET_INVALID,
    );
  }
}
