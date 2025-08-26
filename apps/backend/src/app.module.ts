import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SnapsModule } from './snaps/snaps.module';
import configuration from 'common/config/configuration';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { StorageService } from './storage/storage.service';
import { StorageModule } from './storage/storage.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AUTH_PACKAGE_NAME } from 'common/proto/auth/auth';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      global: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'uploads'),
      serveRoot: '/uploads/',
      serveStaticOptions: { index: false },
    }),
    ConfigModule.forRoot({
      // validate,
      isGlobal: true,
      load: [configuration],
    }),

    ClientsModule.register([
      {
        name: 'AUTH_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: AUTH_PACKAGE_NAME,
          protoPath: join(__dirname, '..', 'auth.proto'),
        },
      },
    ]),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('mongo_uri', { infer: true }),
      }),
      inject: [ConfigService],
    }),
    SnapsModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [AppService, StorageService],
})
export class AppModule {}
