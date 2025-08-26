import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

export const AddUsersPhotoDocs = () => {
  return applyDecorators(
    ApiOperation({
      summary: 'Add user image',
      description:
        'Useful for users that need to update their personal images.\n\n' +
        '⚡ On success, user will have new image',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          photo: { type: 'File' },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'User photo added successfully',
      schema: {
        type: 'object',
      },
    }),
    ApiResponse({ status: 400, description: 'Validation failed' }),
  );
};
