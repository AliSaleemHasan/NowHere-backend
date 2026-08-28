import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class GatewayAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Missing Authorization token');
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('ACCESS_SECRET'),
      });

      const user = payload.user || payload;
      const userId = user.id || user.Id || payload.sub;

      // Inject identity headers for downstream service calls
      request.headers['x-user-id'] = userId;
      request.headers['x-user-email'] = user.email || '';
      request.headers['x-user-role'] = user.role || 'USER';

      request['user'] = {
        id: userId,
        Id: userId,
        _id: userId,
        email: user.email,
        role: user.role,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

// Keep backward compatibility export
export { GatewayAuthGuard as AuthGuard };
