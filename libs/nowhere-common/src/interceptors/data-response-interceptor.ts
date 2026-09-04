import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { Request } from 'express';

export class DataResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    // Only wrap HTTP responses; leave RPC/microservice transports untouched
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const path = (request.path || request.url || '').split('?')[0];
    if (
      path === '/health' ||
      path.endsWith('/health') ||
      path === '/docs' ||
      path === '/docs-json' ||
      path.startsWith('/docs/')
    ) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        // Prevent double wrapping if data is already in standard envelope format
        if (
          data !== null &&
          typeof data === 'object' &&
          'success' in data &&
          'data' in data &&
          Object.keys(data).length === 2
        ) {
          return data;
        }
        return { success: true, data: data ?? null };
      }),
    );
  }
}
