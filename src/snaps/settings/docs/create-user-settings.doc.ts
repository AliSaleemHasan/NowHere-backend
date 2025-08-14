import { applyDecorators } from '@nestjs/common';
import {
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { SnapSettings } from '../schemas/settings.schema';

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
      type: SnapSettings,
      description: 'Snap Setting  created successfully for User',
    }),
    ApiResponse({ status: 400, description: 'Validation error' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
