import { applyDecorators } from '@nestjs/common';
import { ApiAcceptedResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';

export function GetAllFilesDoc() {
  return applyDecorators(
    ApiAcceptedResponse({
      description:
        'List of all files (with a defined prefix) inside the s3 bucket ',
      schema: {
        type: 'object',
        description: 'Array of strings (keys for files in s3)',
      },
    }),
    ApiBearerAuth(),
  );
}
