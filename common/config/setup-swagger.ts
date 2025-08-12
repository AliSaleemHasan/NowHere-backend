import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Nowhere API')
    .setDescription('Now Here API documentation')
    .setVersion('1.0')
    .addServer('http://localhost:3000')
    // .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      requestInterceptor: (req) => {
        const token = localStorage.getItem('accessToken');
        if (token) req.headers['Authorization'] = `Bearer ${token}`;
        return req;
      },
      responseInterceptor: (res) => {
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
