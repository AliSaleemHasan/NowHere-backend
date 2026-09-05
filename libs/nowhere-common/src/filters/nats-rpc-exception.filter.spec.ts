import { ArgumentsHost, NotFoundException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { NatsRpcExceptionFilter } from './nats-rpc-exception.filter';

function httpHost(response: {
  status: jest.Mock;
  json: jest.Mock;
  setHeader: jest.Mock;
}): ArgumentsHost {
  return {
    getType: () => 'http',
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({ url: '/seed', method: 'GET' }),
    }),
  } as unknown as ArgumentsHost;
}

describe('NatsRpcExceptionFilter', () => {
  const filter = new NatsRpcExceptionFilter();

  it('writes an HTTP problem response instead of hanging the socket', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const setHeader = jest.fn();

    filter.catch(new NotFoundException('missing'), httpHost({ status, json, setHeader }));

    expect(setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/problem+json',
    );
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ status: 404, detail: 'missing' }),
    );
  });

  it('still serializes errors for NATS/RPC callers', async () => {
    const rpcHost = { getType: () => 'rpc' } as unknown as ArgumentsHost;
    await expect(
      lastValueFrom(filter.catch(new NotFoundException('missing'), rpcHost)),
    ).rejects.toBeInstanceOf(RpcException);
  });
});
