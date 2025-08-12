import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { SigninDTO } from '../dto/signin.dto';

export function LoginDocs() {
  return applyDecorators(
    ApiTags('Auth'),
    ApiOperation({
      summary: 'Login user',
      description:
        'Authenticates user and returns access + refresh tokens.\n\n' +
        '⚡ On success, tokens are stored in Swagger global variables for authenticated requests.',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              email: { type: 'string', example: 't@t.com' },
              password: { type: 'string', example: 'Qqqqqq1!' },
            },
            required: ['email', 'password'],
          },
        },
        example: {
          user: {
            email: 't@t.com',
            password: 'Qqqqqq1!',
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Login successful',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              accessToken: {
                type: 'string',
                example: 'jwt-access-token-example',
              },
              refreshToken: {
                type: 'string',
                example: 'jwt-refresh-token-example',
              },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Invalid credentials' }),
  );
}
