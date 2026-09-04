import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UserDto } from 'contracts';

interface AuthenticatedRequest extends Request {
  user: UserDto;
}

export const ReqUser = createParamDecorator(
  (data: keyof UserDto, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
