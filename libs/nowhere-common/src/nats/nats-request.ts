import {
  GatewayTimeoutException,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, TimeoutError, timeout } from 'rxjs';
import { readProblemCode } from '../filters/http-problem';

export const DEFAULT_NATS_TIMEOUT_MS = 8_000;

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function messageFrom(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value;
  if (Array.isArray(value) && value.length > 0) {
    return value.map(String).join(', ');
  }
  return undefined;
}

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

  const root = asRecord(err);
  const candidates = [
    root,
    asRecord(root?.error),
    asRecord(root?.message),
    asRecord(asRecord(root?.message)?.error),
  ].filter((item): item is Record<string, unknown> => item !== null);

  for (const candidate of candidates) {
    const statusCode =
      typeof candidate.statusCode === 'number'
        ? candidate.statusCode
        : typeof candidate.status === 'number'
          ? candidate.status
          : undefined;
    if (typeof statusCode !== 'number') continue;
    const message =
      messageFrom(candidate.message) ||
      messageFrom(candidate.detail) ||
      'Request failed';
    const code = readProblemCode(candidate);
    throw new HttpException(
      {
        statusCode,
        message,
        ...(code ? { code } : {}),
      },
      statusCode,
    );
  }

  const fallback = messageFrom(root?.message);
  if (fallback && fallback !== 'Internal server error') {
    throw new InternalServerErrorException(fallback);
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

export function natsConnectionOptions(url?: string) {
  const raw = url || process.env.NATS_URL || 'nats://nats:4222';
  let servers = raw;
  let token = process.env.NATS_TOKEN || undefined;

  try {
    const parsed = new URL(raw);
    if (!token) {
      if (parsed.username && !parsed.password) {
        token = decodeURIComponent(parsed.username);
      } else if (parsed.password) {
        token = decodeURIComponent(parsed.password);
      }
    }
    const host = parsed.hostname;
    const port = parsed.port ? `:${parsed.port}` : '';
    servers = `${parsed.protocol}//${host}${port}`;
  } catch {
    // keep the raw URL if it is not parseable
  }

  return {
    servers: [servers],
    ...(token ? { token } : {}),
  };
}
