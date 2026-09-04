import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';

type HttpProblemBody = {
  statusCode: number;
  message: string;
  code?: string;
};

export function readProblemCode(source: unknown): string | undefined {
  if (typeof source !== 'object' || source === null) {
    return undefined;
  }
  const code = (source as { code?: unknown }).code;
  return typeof code === 'string' && code.length > 0 ? code : undefined;
}

export function httpProblem(
  status: number,
  detail: string,
  code?: string,
): HttpException {
  const body: HttpProblemBody = {
    statusCode: status,
    message: detail,
  };
  if (code) {
    body.code = code;
  }
  if (status === (HttpStatus.FORBIDDEN as number)) {
    return new ForbiddenException(body);
  }
  if (status === (HttpStatus.NOT_FOUND as number)) {
    return new NotFoundException(body);
  }
  if (status === (HttpStatus.CONFLICT as number)) {
    return new ConflictException(body);
  }
  return new HttpException(body, status);
}

export function throwHttpProblem(
  status: number,
  detail: string,
  code?: string,
): never {
  throw httpProblem(status, detail, code);
}
