import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export function GetByIdDocs() {
  return applyDecorators(
    ApiOperation({
      description: 'Get users by id',
    }),
    ApiParam({
      name: 'id',
      allowEmptyValue: false,
      type: 'string',
    }),
    ApiResponse({
      type: User,
      status: 200,
    }),
  );
}
