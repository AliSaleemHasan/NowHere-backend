import { applyDecorators } from '@nestjs/common';
import { ApiAcceptedResponse, ApiQuery, ApiTags } from '@nestjs/swagger';

export function GetSignURLDoc() {
  return applyDecorators(
    ApiAcceptedResponse({
      type: 'string',
      description: 'the signed URL to access the requested object on s3',
    }),
    ApiQuery({
      type: 'uri',
      description: 'requested object key',
    }),
  );
}
