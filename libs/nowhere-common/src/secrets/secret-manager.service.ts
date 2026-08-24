import { Injectable, Logger, Inject } from '@nestjs/common';
import {
  SECRETS_STRATEGY,
  SecretsStrategy,
} from './secrets-strategy.interface';

@Injectable()
export class SecretManagerService {
  private readonly logger = new Logger(SecretManagerService.name);

  constructor(
    @Inject(SECRETS_STRATEGY) private readonly strategy: SecretsStrategy,
  ) {}

  /**
   * Fetches a secret by name using the active SecretsStrategy,
   * otherwise falls back to process.env or the provided default value.
   */
  async getSecret(
    secretName: string,
    defaultValue?: string,
  ): Promise<string | undefined> {
    try {
      const secret = await this.strategy.getSecret(secretName);
      if (secret !== undefined) {
        return secret;
      }
    } catch (error: any) {
      this.logger.warn(
        `Failed to fetch secret "${secretName}" via strategy: ${error?.message}. Falling back to environment.`,
      );
    }
    return process.env[secretName] ?? defaultValue;
  }

  /**
   * Loads multiple secrets into process.env if available from the secret manager.
   */
  async loadSecretsIntoEnv(secretNames: string[]): Promise<void> {
    for (const name of secretNames) {
      try {
        const secretValue = await this.getSecret(name);
        if (secretValue !== undefined) {
          process.env[name] = secretValue;
        }
      } catch (err: any) {
        this.logger.warn(
          `Could not populate process.env for "${name}": ${err?.message}`,
        );
      }
    }
  }
}
