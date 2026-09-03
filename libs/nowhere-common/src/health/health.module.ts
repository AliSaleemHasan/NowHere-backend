import { DynamicModule, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { MemoryHealthController } from './memory-health.controller';
import { MongooseHealthController } from './mongoose-health.controller';
import { TypeOrmHealthController } from './typeorm-health.controller';

@Module({})
export class HealthModule {
  static forMemory(): DynamicModule {
    return {
      module: HealthModule,
      imports: [TerminusModule],
      controllers: [MemoryHealthController],
    };
  }

  static forTypeOrm(): DynamicModule {
    return {
      module: HealthModule,
      imports: [TerminusModule],
      controllers: [TypeOrmHealthController],
    };
  }

  static forMongoose(): DynamicModule {
    return {
      module: HealthModule,
      imports: [TerminusModule],
      controllers: [MongooseHealthController],
    };
  }
}
