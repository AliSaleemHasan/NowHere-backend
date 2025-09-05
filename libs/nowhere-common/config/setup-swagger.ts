import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

export function setupSwagger(
  app: INestApplication,
  microservice: {
    port: number;
    name: 'auth' | 'backend';
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

  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      requestInterceptor: (req: any) => {
        const token = localStorage.getItem('accessToken');
        if (token) req.headers['Authorization'] = `Bearer ${token}`;
        return req;
      },
      responseInterceptor: (res: any) => {
        try {
          const body = JSON.parse(res.text);
          if (body?.data?.tokens?.accessToken) {
            localStorage.setItem('accessToken', body.data.tokens.accessToken);
            localStorage.setItem('refreshToken', body.data.tokens.refreshToken);
          }
        } catch {}
        return res;
      },
    },
  });
}
