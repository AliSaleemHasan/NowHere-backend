import { Injectable, Logger } from '@nestjs/common';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import { SecretsStrategy } from './secrets-strategy.interface';

@Injectable()
export class AWSSecretsStrategy implements SecretsStrategy {
  private readonly logger = new Logger(AWSSecretsStrategy.name);
  private client?: SecretsManagerClient;

  constructor() {
    const region = process.env.AWS_REGION || 'us-east-1';
    try {
      this.client = new SecretsManagerClient({
        region,
        endpoint: process.env.AWS_SECRETS_ENDPOINT || undefined,
        credentials:
          process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
            ? {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
              }
            : undefined,
      });
    } catch (err: any) {
      this.logger.warn(
        `Failed to initialize AWS SecretsManagerClient: ${err.message}.`,
      );
    }
  }

  async getSecret(secretName: string): Promise<string | undefined> {
    if (!this.client) return undefined;

    try {
      const command = new GetSecretValueCommand({ SecretId: secretName });
      const response = await this.client.send(command);
      return response.SecretString;
    } catch (error: any) {
      this.logger.warn(
        `Failed to fetch secret "${secretName}" from AWS Secrets Manager: ${error.message}`,
      );
      return undefined;
    }
  }
}
