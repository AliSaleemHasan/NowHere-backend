import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { SnapsModule } from './snaps/snaps.module';
import { configuration } from 'nowhere-common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { JwtModule } from '@nestjs/jwt';
import { SeedModule } from './seed/seed.module';
@Module({
  imports: [
    JwtModule.register({
      global: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'tmp'),
      serveRoot: `/${process.env.STATIC_TMP_FILES}/`,
      serveStaticOptions: { index: false },
    }),
    ConfigModule.forRoot({
      // validate,
      isGlobal: true,
      load: [configuration],
    }),

    MongooseModule.forRoot(
      `mongodb+srv://${process.env.MONGO_ROOT_USER}:${process.env.MONGO_ROOT_PASS}@nowhere.efgivau.mongodb.net/?retryWrites=true&w=majority&appName=nowhere`,
      { authSource: 'admin' },
    ),
    SnapsModule,
    SeedModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
