import { HttpStatus } from '@nestjs/common';
import { ExceptionMapper, ProblemDetails } from '../problem-details.interface';

export class FallbackExceptionMapper implements ExceptionMapper<unknown> {
  canHandle(): boolean {
    return true;
  }

  map(exception: unknown, requestUrl: string): ProblemDetails {
    return {
      type: 'about:blank',
      title: 'Internal Server Error',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      detail: 'An unexpected error occurred.',
      instance: requestUrl,
      timestamp: new Date().toISOString(),
    };
  }
}
