import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATS_CLIENT, natsRequest } from 'nowhere-common';

@Injectable()
export class GatewayRpcClient {
  constructor(@Inject(NATS_CLIENT) private readonly natsClient: ClientProxy) {}

  request<TResult = unknown, TInput = unknown>(
    pattern: string,
    data: TInput,
    timeoutMs?: number,
  ): Promise<TResult> {
    return natsRequest<TResult, TInput>(
      this.natsClient,
      pattern,
      data,
      timeoutMs,
    );
  }
}
