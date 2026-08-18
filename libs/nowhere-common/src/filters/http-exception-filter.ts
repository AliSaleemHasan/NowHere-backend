import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Request, Response } from 'express';
import { NowHereLogger } from '../loggers';
import { ExceptionMapperRegistry } from './exception-mapper.registry';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new NowHereLogger(HttpExceptionFilter.name, {});
  private readonly registry = new ExceptionMapperRegistry();
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (!response || typeof response.status !== 'function') {
      return;
    }

    const problem = this.registry.map(exception, request.url);
    if (problem.status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} - ${problem.status} ${problem.title}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `[${request.method}] ${request.url} - ${problem.status} ${problem.title}: ${JSON.stringify(
          problem.detail,
        )}`,
      );
    }

    response.setHeader('Content-Type', 'application/problem+json');
    response.status(problem.status).json(problem);
  }
}
