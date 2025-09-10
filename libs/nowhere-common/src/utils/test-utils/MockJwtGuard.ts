import { CanActivate, ExecutionContext } from '@nestjs/common';

export class MockJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { _id: 'fake-user-id' }; // mock user
    return true;
  }
}
