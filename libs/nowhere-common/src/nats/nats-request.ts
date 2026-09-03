import {
  GatewayTimeoutException,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, TimeoutError, timeout } from 'rxjs';

export const DEFAULT_NATS_TIMEOUT_MS = 8_000;

export function mapNatsError(err: unknown): never {
  if (err instanceof HttpException) {
    throw err;
  }

  if (
    err instanceof TimeoutError ||
    (err &&
      typeof err === 'object' &&
      ((err as { name?: string }).name === 'TimeoutError' ||
        (err as { message?: string }).message === 'Timeout has occurred'))
  ) {
    throw new GatewayTimeoutException('Upstream service timeout');
  }

  const e = err as {
    statusCode?: number;
    message?: unknown;
    error?: { statusCode?: number; message?: unknown };
  } | null;

  const payload =
    e && typeof e === 'object'
      ? typeof e.statusCode === 'number'
        ? e
        : e.error && typeof e.error === 'object'
          ? e.error
          : e.message && typeof e.message === 'object'
            ? (e.message as { statusCode?: number; message?: unknown })
            : null
      : null;

  if (payload && typeof payload.statusCode === 'number') {
    const rawMessage = payload.message;
    const message =
      typeof rawMessage === 'string'
        ? rawMessage
        : Array.isArray(rawMessage)
          ? rawMessage.map(String).join(', ')
          : 'Request failed';
    throw new HttpException(message, payload.statusCode);
  }

  throw new InternalServerErrorException('Internal server error');
}

export async function natsRequest<TResult = unknown, TInput = unknown>(
  client: ClientProxy,
  pattern: string,
  data: TInput,
  timeoutMs: number = DEFAULT_NATS_TIMEOUT_MS,
): Promise<TResult> {
  try {
    return await firstValueFrom(
      client.send<TResult, TInput>(pattern, data).pipe(timeout(timeoutMs)),
    );
  } catch (err) {
    mapNatsError(err);
  }
}

export function natsConnectionOptions() {
  return {
    servers: [process.env.NATS_URL || 'nats://nats:4222'],
  };
}
