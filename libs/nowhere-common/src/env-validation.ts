import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

// make validation utils usable for all services at once
export function getValidateFn(variables: ClassConstructor<any>) {
  return function validate(config: Record<string, unknown>) {
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
