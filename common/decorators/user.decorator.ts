import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from 'apps/backend/src/users/entities/user.entity';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: User;
}
export const ReqUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    return data ? user?.[data as keyof typeof user] : user;
  },
);
