import { bootstrapApp } from 'nowhere-common';
import { StorageModule } from './storage.module';

void bootstrapApp({
  module: StorageModule,
  defaultPort: 3002,
  microservice: true,
});
