import { HttpStatus } from '@nestjs/common';
import { ProblemCodes } from 'contracts';
import { throwHttpProblem } from 'nowhere-common';
import { Credential } from './entities/user-credentials-entity';

export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_DURATION_MS = 15 * 60 * 1000;

export function isAccountLocked(
  user: Pick<Credential, 'lockedUntil'>,
  now = Date.now(),
): boolean {
  if (!user.lockedUntil) return false;
  return new Date(user.lockedUntil).getTime() > now;
}

export function assertAccountUnlocked(
  user: Pick<Credential, 'lockedUntil'>,
): void {
  if (isAccountLocked(user)) {
    throwHttpProblem(
      HttpStatus.LOCKED,
      'Account is locked',
      ProblemCodes.ACCOUNT_LOCKED,
    );
  }
}

export function withRecordedFailure(
  user: Pick<Credential, 'failedLoginCount' | 'lockedUntil'>,
  now = Date.now(),
): Pick<Credential, 'failedLoginCount' | 'lockedUntil'> {
  const failedLoginCount = (user.failedLoginCount ?? 0) + 1;
  return {
    failedLoginCount,
    lockedUntil:
      failedLoginCount >= MAX_FAILED_LOGIN_ATTEMPTS
        ? new Date(now + LOGIN_LOCKOUT_DURATION_MS)
        : user.lockedUntil,
  };
}
