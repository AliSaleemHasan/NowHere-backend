import { Module } from '@nestjs/common';
import { AwsStorageModule } from './aws-storage/aws-storage.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    AwsStorageModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.register({
      global: true,
    }),
  ],
})
export class StorageModule {}
