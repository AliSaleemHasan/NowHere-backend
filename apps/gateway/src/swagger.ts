import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

export function createGatewayOpenApiDocument(
  app: INestApplication,
): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('NowHere Gateway')
    .setDescription(
      'HTTP API for the NowHere local demo (`docker compose -f docker-compose.dev.yml up`). JSON bodies are wrapped as `{ success, data }` except `GET /health` and `/docs`. Authenticate with a Bearer access token. Mailhog UI: http://localhost:8025. DSGVO: `GET /users/me/export`, `DELETE /users/me`.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  return SwaggerModule.createDocument(app, config);
}

export function setupSwagger(app: INestApplication): void {
  SwaggerModule.setup('docs', app, createGatewayOpenApiDocument(app));
}
