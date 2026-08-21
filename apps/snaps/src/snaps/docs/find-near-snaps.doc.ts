import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Snap } from '../schemas/snap.schema';

export function FindNearSnapsDocs() {
  return applyDecorators(
    ApiTags('Snaps'),
    ApiOperation({ summary: 'Find snaps near location' }),
    ApiParam({ name: 'lng', type: Number }),
    ApiParam({ name: 'lat', type: Number }),
    ApiResponse({ status: 200, type: [Snap] }),
  );
}
