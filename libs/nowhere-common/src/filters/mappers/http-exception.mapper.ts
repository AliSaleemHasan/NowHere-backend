import { HttpException } from '@nestjs/common';
import { STATUS_CODES } from 'http';
import { readProblemCode } from '../http-problem';
import { ExceptionMapper, ProblemDetails } from '../problem-details.interface';

export class HttpExceptionMapper implements ExceptionMapper<HttpException> {
  canHandle(exception: unknown): boolean {
    return exception instanceof HttpException;
  }

  map(exception: HttpException, requestUrl: string): ProblemDetails {
    const status = exception.getStatus();
    const response = exception.getResponse();
    let detail = 'An HTTP error occurred';
    let errors: unknown = undefined;
    let code: string | undefined;

    if (typeof response === 'string') {
      detail = response;
    } else if (typeof response === 'object' && response !== null) {
      const resObj = response as Record<string, unknown>;
      code = readProblemCode(resObj);
      if (Array.isArray(resObj.message)) {
        detail = 'Validation failed';
        errors = resObj.message;
      } else if (typeof resObj.message === 'string') {
        detail = resObj.message;
      } else if (typeof resObj.error === 'string') {
        detail = resObj.error;
      } else {
        detail = JSON.stringify(resObj);
      }
    }

    const problem: ProblemDetails = {
      type: 'about:blank',
      title: STATUS_CODES[status] ?? exception.name.replace(/Exception$/, ''),
      status: status,
      detail: detail,
      instance: requestUrl,
      timestamp: new Date().toISOString(),
    };

    if (errors !== undefined) {
      problem.errors = errors;
    }
    if (code) {
      problem.code = code;
    }

    return problem;
  }
}
