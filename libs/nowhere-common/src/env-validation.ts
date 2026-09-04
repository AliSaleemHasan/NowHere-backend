import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

export function getValidateFn<T extends object>(variables: ClassConstructor<T>) {
  return function validate(config: Record<string, unknown>): T {
    const validatedConfig = plainToInstance(variables, config, {
      enableImplicitConversion: true,
    });
    const errors = validateSync(validatedConfig, {
      skipMissingProperties: false,
    });

    if (errors.length > 0) {
      throw new Error(errors.toString());
    }
    return validatedConfig;
  };
}
