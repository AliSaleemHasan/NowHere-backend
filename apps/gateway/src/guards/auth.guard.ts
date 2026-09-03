import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtPayload, ROLES } from 'contracts';
import { extractTokenFromHeader } from 'nowhere-common';

@Injectable()
export class GatewayAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Missing Authorization token');
    }
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get('ACCESS_SECRET'),
      });

      const user = payload.user;
      const userId = user?.id || payload.sub;
      const role = user?.role ?? ROLES.USER;

      request.headers['x-user-id'] = userId;
      request.headers['x-user-email'] = user?.email || '';
      request.headers['x-user-role'] = String(role);

      request['user'] = {
        id: userId,
        email: user?.email,
        role,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return true;
  }
}