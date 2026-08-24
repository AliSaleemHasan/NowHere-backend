import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, RequestHandler } from 'http-proxy-middleware';

/**
 * Service route configuration.
 * Maps path prefixes to downstream service URLs.
 */
export interface ServiceRoute {
  /** Path prefix to match (e.g. '/snaps') */
  prefix: string;
  /** Target service URL (e.g. 'http://nowhere-snaps:3000') */
  target: string;
}

/**
 * Creates a proxy middleware factory for a given service route.
 *
 * The middleware forwards all HTTP traffic (including multipart uploads,
 * query params, and Authorization headers) transparently to the downstream
 * service. No request transformation or duplication needed.
 */
export function createServiceProxy(route: ServiceRoute): RequestHandler {
  const logger = new Logger(`Proxy:${route.prefix}`);

  return createProxyMiddleware({
    target: route.target,
    changeOrigin: true,
    // Preserve the original path — /snaps/near/1/2 → /snaps/near/1/2
    pathRewrite: undefined,
    on: {
      proxyReq: (_proxyReq, req) => {
        logger.debug(`→ ${req.method} ${req.url} → ${route.target}`);
      },
      error: (err, req, _res) => {
        logger.error(`Proxy error for ${req.method} ${req.url}: ${err.message}`);
      },
    },
  });
}

// ─── Snaps Proxy ───────────────────────────────────────────────

@Injectable()
export class SnapsProxyMiddleware implements NestMiddleware {
  private readonly proxy: RequestHandler;

  constructor() {
    this.proxy = createServiceProxy({
      prefix: '/snaps',
      target: process.env.SNAPS_SERVICE_URL || 'http://nowhere-snaps:3000',
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    this.proxy(req, res, next);
  }
}

// ─── Users Proxy ───────────────────────────────────────────────

@Injectable()
export class UsersProxyMiddleware implements NestMiddleware {
  private readonly proxy: RequestHandler;

  constructor() {
    this.proxy = createServiceProxy({
      prefix: '/users',
      target: process.env.USERS_SERVICE_URL || 'http://nowhere-users:3001',
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    this.proxy(req, res, next);
  }
}

// ─── Storage Proxy ─────────────────────────────────────────────

@Injectable()
export class StorageProxyMiddleware implements NestMiddleware {
  private readonly proxy: RequestHandler;

  constructor() {
    this.proxy = createServiceProxy({
      prefix: '/storage',
      target: process.env.STORAGE_SERVICE_URL || 'http://nowhere-storage:3002',
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    this.proxy(req, res, next);
  }
}
