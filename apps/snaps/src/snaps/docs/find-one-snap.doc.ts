import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Snap } from '../schemas/snap.schema';

export function FindOneSnapDocs() {
  return applyDecorators(
    ApiTags('Snaps'),
    ApiOperation({ summary: 'Get snap by ID' }),
    ApiParam({ name: 'id', type: String, description: 'Snap ID' }),
    ApiResponse({ status: 200, type: Snap }),
    ApiResponse({ status: 404, description: 'Snap not found' }),
  );
}
