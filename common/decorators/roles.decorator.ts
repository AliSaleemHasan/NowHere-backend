import { Reflector } from '@nestjs/core';

export const UserRoles = Reflector.createDecorator<string[]>();
