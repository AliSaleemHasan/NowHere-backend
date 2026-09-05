import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  RpcExceptionFilter,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { EMPTY, Observable, throwError } from 'rxjs';
import { HttpExceptionFilter } from './http-exception-filter';
import { readProblemCode } from './http-problem';

export interface SerializedRpcError {
  statusCode: number;
  message: string;
  code?: string;
}

function serializeUnknown(exception: unknown): SerializedRpcError {
  if (exception instanceof RpcException) {
    const error = exception.getError();
    if (typeof error === 'object' && error && 'statusCode' in error) {
      const payload = error as SerializedRpcError;
      const code = readProblemCode(payload);
      return {
        statusCode:
          Number(payload.statusCode) || HttpStatus.INTERNAL_SERVER_ERROR,
        message:
          typeof payload.message === 'string'
            ? payload.message
            : 'Request failed',
        ...(code ? { code } : {}),
      };
    }
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: typeof error === 'string' ? error : 'Internal server error',
    };
  }

  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const response = exception.getResponse();
    let message = exception.message;
    let code: string | undefined;
    if (typeof response === 'string') {
      message = response;
    } else if (typeof response === 'object' && response !== null) {
      const body = response as { message?: string | string[] };
      code = readProblemCode(body);
      if (typeof body.message === 'string') {
        message = body.message;
      } else if (Array.isArray(body.message)) {
        message = body.message.join(', ');
      }
    }
    return { statusCode: status, message, ...(code ? { code } : {}) };
  }

  if (
    exception &&
    typeof exception === 'object' &&
    'issues' in exception &&
    Array.isArray((exception as { issues: { message?: string }[] }).issues)
  ) {
    const issues = (exception as { issues: { message?: string }[] }).issues;
    return {
      statusCode: HttpStatus.BAD_REQUEST,
      message: issues[0]?.message || 'Validation failed',
    };
  }

  return {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'Internal server error',
  };
}

@Catch()
export class NatsRpcExceptionFilter implements RpcExceptionFilter {
  private readonly httpFilter = new HttpExceptionFilter();

  catch(exception: unknown, host?: ArgumentsHost): Observable<never> {
    // This filter is registered on the HTTP app as well as NATS. On HTTP it
    // must write a response; returning an Observable leaves the socket open.
    if (host && typeof host.getType === 'function' && host.getType() === 'http') {
      this.httpFilter.catch(exception, host);
      return EMPTY as Observable<never>;
    }

    const payload = serializeUnknown(exception);
    return throwError(() => new RpcException(payload));
  }
}
