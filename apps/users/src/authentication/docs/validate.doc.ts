import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

export function ValidateDocs() {
  return applyDecorators(
    ApiTags('Auth'),
    ApiOperation({
      summary: 'Validate access token',
      description: 'Checks if the provided token is valid',
    }),
    ApiResponse({ status: 200, description: 'Token is valid' }),
    ApiResponse({ status: 401, description: 'Token is invalid or expired' }),
  );
}
