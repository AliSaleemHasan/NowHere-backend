import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Snap } from '../schemas/snap.schema';

export function FindAllSnapsDocs() {
  return applyDecorators(
    ApiTags('Snaps'),
    ApiOperation({ summary: 'Get all snaps' }),
    ApiResponse({ status: 200, type: [Snap] }),
  );
}
