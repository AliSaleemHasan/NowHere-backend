import { bootstrapApp } from 'nowhere-common';
import { AppModule } from './app.module';

void bootstrapApp({
  module: AppModule,
  defaultPort: 3000,
  microservice: true,
  inheritAppConfig: true,
});
