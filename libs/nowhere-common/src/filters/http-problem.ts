import {
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
  if (status === HttpStatus.FORBIDDEN) {
    return new ForbiddenException(body);
  }
  if (status === HttpStatus.NOT_FOUND) {
    return new NotFoundException(body);
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
