# Exception Handling Improvements (`exceptionTodo.md`)

## Current Problems

1. **Catches ONLY `HttpException` (`@Catch(HttpException)`):**
   - Unhandled runtime exceptions (e.g. `TypeError`, `Database Error`, `SyntaxError`, null pointers) are completely missed by the current filter.
   - When an unexpected error occurs, Node/Nest defaults to unformatted error dumps or crashes the request without proper logging.

2. **gRPC Exceptions Are Swallowed or Unhandled:**
   - gRPC microservices (`users`, `snaps`, `authentication`) use gRPC status codes (e.g. `NOT_FOUND`, `UNAUTHENTICATED`), not HTTP status codes.
   - Applying an HTTP filter (`ctx.getResponse<Response>()`) inside a gRPC transport service fails or crashes because `host.switchToHttp().getResponse()` is `undefined` in gRPC context.

3. **No Fallback / Incomplete Response Branching:**
   - In `http-exception-filter.ts`, if `typeof exception_error !== 'string'` (e.g., when NestJS throws an object payload like `{ statusCode: 400, message: ['email must be an email'] }`), the filter does **NOTHING**.
   - It exits without calling `response.status().json()`, causing the HTTP request to **hang until gateway timeout**.

4. **Inconsistent JSON Schema Output:**
   - In the `try` block, it returns `{ success: false, ...exception_error, path }`.
   - In the `catch` block, it returns `{ success: false, message, path, error }`.
   - API clients receive completely different response structures depending on how the exception was raised.

5. **No Error Logging (`Logger` missing):**
   - Exceptions are returned to the client without being logged to server logs (`Logger.error(...)`), making production debugging impossible.

---

## Action Plan & Code Improvements

### 1. Improved Unified HTTP Exception Filter
Replace `libs/nowhere-common/src/filters/http-exception-filter.ts` with a catch-all filter (`@Catch()`) that handles both `HttpException` and unhandled `Error` instances safely:

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Skip non-HTTP transports (e.g. gRPC)
    if (!response || typeof response.status !== 'function') {
      return;
    }

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const message =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? (exceptionResponse as any).message || exceptionResponse
        : exceptionResponse;

    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status} - Error: ${JSON.stringify(message)}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    // Standardized, consistent API error contract
    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
```

---

### 2. Add gRPC Exception Filter for Microservices
For microservices like `Users` or `Authentication`, create a gRPC exception filter in `nowhere-common`:

```typescript
import { Catch, RpcExceptionFilter, ArgumentsHost, Logger } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

@Catch()
export class GrpcExceptionFilter implements RpcExceptionFilter<RpcException> {
  private readonly logger = new Logger(GrpcExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost): Observable<any> {
    this.logger.error(`gRPC Error: ${exception.message}`, exception.stack);
    return throwError(() => new RpcException(exception.message || 'gRPC Error'));
  }
}
```
