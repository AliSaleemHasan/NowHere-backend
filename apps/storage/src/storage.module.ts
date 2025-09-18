import { Module } from '@nestjs/common';
import { AwsStorageModule } from './aws-storage/aws-storage.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import * as path from 'path';
@Module({
  imports: [
    AwsStorageModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [path.resolve(process.cwd(), '.env')],
    }),
    JwtModule.register({
      global: true,
    }),
  ],
})
export class StorageModule {}
