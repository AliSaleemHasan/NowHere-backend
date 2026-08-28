import { Reflector } from '@nestjs/core';
import { ROLES } from 'contracts';

export const UserRoles = Reflector.createDecorator<ROLES[]>();
