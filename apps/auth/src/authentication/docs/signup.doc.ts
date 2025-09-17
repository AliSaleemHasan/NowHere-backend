import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';

export function SignupDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Register user',
      description:
        'Creates a new user and returns tokens.\n\n' +
        '⚡ On success, tokens are stored in Swagger global variables.',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              email: { type: 'string', example: 't@t.com' },
              firstName: { type: 'string', example: 'test_firstname' },
              lastName: { type: 'string', example: 'test_lastname' },
              password: { type: 'string', example: 'Qqqqqq1!' },
            },
            required: ['email', 'firstName', 'lastName', 'password'],
          },
        },
        example: {
          user: {
            email: 't@t.com',
            firstName: 'test_firstname',
            lastName: 'test_lastname',
            password: 'Qqqqqq1!',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'User registered successfully',
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
    ApiResponse({ status: 400, description: 'Validation failed' }),
  );
}
