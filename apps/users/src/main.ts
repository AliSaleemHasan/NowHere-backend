import { bootstrapApp } from 'nowhere-common';
import { UsersAppModule } from './app.module';

void bootstrapApp({
  module: UsersAppModule,
  defaultPort: 3001,
  microservice: true,
});
