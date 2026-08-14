import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

export function DeleteAllSnapsDocs() {
  return applyDecorators(
    ApiTags('Snaps'),
    ApiOperation({ summary: 'Delete all snaps' }),
    ApiResponse({ status: 200, description: 'All snaps deleted' }),
  );
}
