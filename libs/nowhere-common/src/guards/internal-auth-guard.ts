import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class InternalAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = (request.headers['x-user-id'] ||
      request.headers['x-user-sub']) as string;

    if (!userId) {
      throw new UnauthorizedException('Missing internal auth headers');
    }

    // Reconstruct user object from trusted headers forwarded by API Gateway
    request['user'] = {
      id: userId,
      email: (request.headers['x-user-email'] as string) || '',
      role: (request.headers['x-user-role'] as string) || 'USER',
    };

    return true;
  }
}
