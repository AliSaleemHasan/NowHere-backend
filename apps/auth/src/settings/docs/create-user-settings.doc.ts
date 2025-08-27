import { applyDecorators } from '@nestjs/common';
import {
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';

export function CreateUserSnapSettings() {
  return applyDecorators(
    ApiTags('Snaps/settings'),
    ApiOperation({
      summary: 'Create User Snap Settings',
    }),
    ApiConsumes('application/json'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          userId: {
            type: 'string',
            example: 'uuid',
          },
        },
        required: ['userId'],
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Snap Setting  created successfully for User',
    }),
    ApiResponse({ status: 400, description: 'Validation error' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
