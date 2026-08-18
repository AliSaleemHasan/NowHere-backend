import { HttpStatus } from '@nestjs/common';
import { ExceptionMapper, ProblemDetails } from '../problem-details.interface';

export class FallbackExceptionMapper implements ExceptionMapper<unknown> {
  canHandle(): boolean {
    return true;
  }

  map(exception: unknown, requestUrl: string): ProblemDetails {
    const isError = exception instanceof Error;
    return {
      type: 'about:blank',
      title: isError ? exception.name : 'Internal Server Error',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      detail: isError
        ? exception.message
        : typeof exception === 'string'
          ? exception
          : 'An unexpected error occurred.',
      instance: requestUrl,
      timestamp: new Date().toISOString(),
    };
  }
}
