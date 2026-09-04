import { bootstrapApp } from 'nowhere-common';
import { AuthenticationModule } from './authentication.module';

void bootstrapApp({
  module: AuthenticationModule,
  defaultPort: 3004,
  microservice: true,
});
