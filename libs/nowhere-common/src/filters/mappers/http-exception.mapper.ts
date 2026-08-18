import { HttpException } from '@nestjs/common';
import { ExceptionMapper, ProblemDetails } from '../problem-details.interface';

export class HttpExceptionMapper implements ExceptionMapper<HttpException> {
  canHandle(exception: unknown): boolean {
    return exception instanceof HttpException;
  }

  map(exception: HttpException, requestUrl: string): ProblemDetails {
    const status = exception.getStatus();
    const response = exception.getResponse();
    let detail: string | string[] | Record<string, any> =
      'An Http error occurred';
    if (typeof response === 'string') {
      detail = response;
    } else if (typeof response === 'object' && response !== null) {
      const resObj = response as Record<string, unknown>;
      const message =
        typeof resObj.message === 'string' || Array.isArray(resObj.message)
          ? resObj.message
          : undefined;
      const error = typeof resObj.error === 'string' ? resObj.error : undefined;
      detail = message || error || JSON.stringify(resObj);
    }
    return {
      type: 'about:blank',
      title: exception.name.replace(/Exception$/, ''),
      status: status,
      detail: detail,
      instance: requestUrl,
      timestamp: new Date().toISOString(),
    };
  }
}
