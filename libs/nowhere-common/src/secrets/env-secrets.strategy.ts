import { Injectable } from '@nestjs/common';
import { SecretsStrategy } from './secrets-strategy.interface';

@Injectable()
export class EnvSecretsStrategy implements SecretsStrategy {
  async getSecret(secretName: string): Promise<string | undefined> {
    return process.env[secretName];
  }
}
