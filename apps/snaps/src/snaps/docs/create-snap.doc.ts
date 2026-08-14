import { applyDecorators } from '@nestjs/common';
import {
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { Snap } from '../schemas/snap.schema';

export function CreateSnapDocs() {
  return applyDecorators(
    ApiTags('Snaps'),
    ApiOperation({
      summary: 'Create snap',
      description: 'Uploads snap images and creates a new snap entry',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            example: JSON.stringify({
              type: 'Point',
              coordinates: [4.9041, 52.3676], // Amsterdam example
            }),
            description: 'GeoJSON location object as a string',
          },
          snaps: {
            type: 'array',
            items: { type: 'string', format: 'binary' },
            description: 'Snap image files',
          },
          description: {
            type: 'string',
            example: 'this is test',
          },
        },
        required: ['location', 'description'],
      },
    }),
    ApiResponse({
      status: 201,
      type: Snap,
      description: 'Snap created successfully',
    }),
    ApiResponse({ status: 400, description: 'Validation error' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
