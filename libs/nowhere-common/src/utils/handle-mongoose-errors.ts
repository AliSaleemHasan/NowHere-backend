import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Error as MongooseError } from 'mongoose';

export function isMongoDuplicateKey(err: unknown, field?: string): boolean {
  if (!err || typeof err !== 'object') {
    return false;
  }
  const e = err as {
    code?: number;
    keyPattern?: Record<string, unknown>;
    keyValue?: Record<string, unknown>;
  };
  if (e.code !== 11000) {
    return false;
  }
  if (!field) {
    return true;
  }
  return Boolean(e.keyPattern?.[field] || e.keyValue?.[field]);
}

export function handleMongoError(err: unknown): never {
  if (isMongoDuplicateKey(err)) {
    throw new ConflictException('Duplicate value for a unique field');
  }
  if (err instanceof MongooseError.ValidationError) {
    throw new BadRequestException(err.message);
  }
  throw new InternalServerErrorException('Database operation failed');
}
