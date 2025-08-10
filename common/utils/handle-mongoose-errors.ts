import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Error as MongooseError } from 'mongoose';

export function handleMongoError(err: any) {
  if (err.code === 11000) {
    throw new ConflictException('Duplicate value for a unique field');
  }
  if (err instanceof MongooseError.ValidationError) {
    throw new BadRequestException(err.message);
  }
  throw new InternalServerErrorException('Database operation failed');
}
