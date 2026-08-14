import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    let exception_error = exception.getResponse();
    if (typeof exception_error === 'string')
      try {
        exception_error = JSON.parse(exception_error) as Object;
        response.status(status).json({
          success: false,
          ...exception_error,
          path: request.url,
        });
      } catch (e) {
        response.status(status).json({
          success: false,
          message: exception_error,
          path: request.url,
          error: exception_error,
        });
      }
  }
}
