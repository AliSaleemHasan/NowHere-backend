import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { CreateUserDTO } from 'src/users/dto/create-user.dto';

export function SignupDocs() {
  return applyDecorators(
    ApiTags('Auth'),
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
              first_name: { type: 'string', example: 'test_firstname' },
              last_name: { type: 'string', example: 'test_lastname' },
              password: { type: 'string', example: 'Qqqqqq1!' },
            },
            required: ['email', 'first_name', 'last_name', 'password'],
          },
        },
        example: {
          user: {
            email: 't@t.com',
            first_name: 'test_firstname',
            last_name: 'test_lastname',
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
