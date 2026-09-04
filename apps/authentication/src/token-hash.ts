import { createHmac, randomBytes } from 'crypto';

export function generateResetToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashResetToken(token: string, pepper: string): string {
  return createHmac('sha256', pepper).update(token).digest('hex');
}
