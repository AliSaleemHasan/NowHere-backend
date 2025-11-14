import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

export function setupSwagger(
  app: INestApplication,
  microservice: {
    port: number;
    name: 'users' | 'backend';
  },
) {
  const config = new DocumentBuilder()
    .setTitle(`Nowhere's ${microservice.name} API`)
    .setDescription(`NowHere's ${microservice.name} API documentation`)
    .setVersion('1.0')
    .addServer(`http://localhost:${microservice.port}`)
    // .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document, {});
}
