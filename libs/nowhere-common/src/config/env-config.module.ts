import { DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClassConstructor } from 'class-transformer';
import * as path from 'path';
import { getValidateFn } from '../env-validation';

export function createEnvConfigModule<T extends object>(
  variables: ClassConstructor<T>,
): Promise<DynamicModule> {
  return ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: [path.resolve(process.cwd(), '.env')],
    validate: getValidateFn(variables),
  });
}
