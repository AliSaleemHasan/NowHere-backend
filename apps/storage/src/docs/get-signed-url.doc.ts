import { applyDecorators } from '@nestjs/common';
import { ApiAcceptedResponse, ApiQuery } from '@nestjs/swagger';

export function GetSignURLDoc() {
  return applyDecorators(
    ApiAcceptedResponse({
      type: 'string',
      description: 'The signed URL to access the requested object on cloud storage',
    }),
    ApiQuery({
      name: 'key',
      type: 'string',
      description: 'Requested object key',
    }),
  );
}
