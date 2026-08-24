import { applyDecorators } from '@nestjs/common';
import { ApiAcceptedResponse, ApiBearerAuth } from '@nestjs/swagger';

export function GetAllFilesDoc() {
  return applyDecorators(
    ApiAcceptedResponse({
      description:
        'List of all files (with a defined prefix) inside cloud storage',
      schema: {
        type: 'object',
        description: 'Array of strings (keys for files in storage)',
      },
    }),
    ApiBearerAuth(),
  );
}
