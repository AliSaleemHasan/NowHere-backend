import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class InternalAuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const internalSecret = req.headers['x-internal-secret'];
    const expectedSecret = process.env.INTERNAL_API_SECRET;

    if (expectedSecret && internalSecret === expectedSecret) {
      return next();
    }

    // Also allow authenticated requests if a valid Bearer token is provided
    if (req.headers.authorization?.startsWith('Bearer ')) {
      return next();
    }

    throw new UnauthorizedException(
      'Access to internal temporary files is restricted',
    );
  }
}
