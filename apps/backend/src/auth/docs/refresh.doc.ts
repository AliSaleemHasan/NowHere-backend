import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

export function RefreshDocs() {
  return applyDecorators(
    ApiTags('Auth'),
    ApiOperation({
      summary: 'Refresh token',
      description: 'Uses refresh token to issue a new access token',
    }),
    ApiResponse({ status: 200, description: 'Tokens refreshed successfully' }),
    ApiResponse({
      status: 401,
      description: 'Invalid or expired refresh token',
    }),
  );
}
