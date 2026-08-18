import { HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status as GrpcStatus } from '@grpc/grpc-js';
import { ExceptionMapper, ProblemDetails } from '../problem-details.interface';

const GRPC_TO_HTTP_STATUS: Record<
  number,
  { status: HttpStatus; title: string }
> = {
  [GrpcStatus.INVALID_ARGUMENT]: {
    status: HttpStatus.BAD_REQUEST,
    title: 'Bad Request',
  },
  [GrpcStatus.UNAUTHENTICATED]: {
    status: HttpStatus.UNAUTHORIZED,
    title: 'Unauthorized',
  },
  [GrpcStatus.PERMISSION_DENIED]: {
    status: HttpStatus.FORBIDDEN,
    title: 'Forbidden',
  },
  [GrpcStatus.NOT_FOUND]: {
    status: HttpStatus.NOT_FOUND,
    title: 'Not Found',
  },
  [GrpcStatus.ALREADY_EXISTS]: {
    status: HttpStatus.CONFLICT,
    title: 'Conflict',
  },
  [GrpcStatus.RESOURCE_EXHAUSTED]: {
    status: HttpStatus.TOO_MANY_REQUESTS,
    title: 'Too Many Requests',
  },
  [GrpcStatus.UNAVAILABLE]: {
    status: HttpStatus.SERVICE_UNAVAILABLE,
    title: 'Service Unavailable',
  },
};

const DEFAULT_HTTP_ERROR = {
  status: HttpStatus.INTERNAL_SERVER_ERROR,
  title: 'Internal Server Error',
};

export class GrpcExceptionMapper implements ExceptionMapper<unknown> {
  canHandle(exception: unknown): boolean {
    if (exception instanceof RpcException) {
      return true;
    }
    return (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      typeof (exception as Record<string, unknown>).code === 'number'
    );
  }

  map(exception: unknown, requestUrl: string): ProblemDetails {
    const { code, detail } = this.extractErrorPayload(exception);
    const { status, title } = GRPC_TO_HTTP_STATUS[code] ?? DEFAULT_HTTP_ERROR;

    return {
      type: 'about:blank',
      title,
      status,
      detail: this.sanitizeDetail(detail),
      instance: requestUrl,
      timestamp: new Date().toISOString(),
    };
  }

  private extractErrorPayload(exception: unknown): {
    code: number;
    detail: string;
  } {
    const error =
      exception instanceof RpcException ? exception.getError() : exception;

    if (typeof error === 'string') {
      return { code: GrpcStatus.INTERNAL, detail: error };
    }

    if (typeof error === 'object' && error !== null) {
      const err = error as {
        code?: number;
        details?: string;
        message?: string;
      };
      return {
        code: err.code ?? GrpcStatus.INTERNAL,
        detail: err.details || err.message || 'A microservice error occurred',
      };
    }

    return {
      code: GrpcStatus.INTERNAL,
      detail: 'A microservice error occurred',
    };
  }

  private sanitizeDetail(detail: string): string {
    // Strip technical gRPC prefixes like "5 NOT_FOUND: User not found" -> "User not found"
    return detail.replace(/^\d+\s+[A-Z_]+:\s*/, '');
  }
}
