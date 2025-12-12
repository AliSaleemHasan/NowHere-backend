import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export function GetAllUsersDocs() {
  return applyDecorators(
    ApiBearerAuth('jwt authentication'),
    ApiOperation({
      description: 'Get Back all users in the DB',
      summary: 'This is an admin action ',
    }),

    ApiResponse({
      type: [User],
      status: 200,
    }),
  );
}
