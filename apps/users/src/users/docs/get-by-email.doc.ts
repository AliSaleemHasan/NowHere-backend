import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export function GetByEmailDocs() {
  return applyDecorators(
    ApiOperation({
      description: 'Just for internal use to authenticate users by emails',
    }),
    ApiParam({
      name: 'email',
      allowEmptyValue: false,
      type: 'string',
    }),
    ApiResponse({
      type: User,
      status: 200,
    }),
  );
}
