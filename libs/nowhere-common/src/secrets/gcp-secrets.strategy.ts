import { Injectable, Logger } from '@nestjs/common';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { SecretsStrategy } from './secrets-strategy.interface';

@Injectable()
export class GCPSecretsStrategy implements SecretsStrategy {
  private readonly logger = new Logger(GCPSecretsStrategy.name);
  private client?: SecretManagerServiceClient;
  private projectId?: string;

  constructor() {
    this.projectId =
      process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
    if (this.projectId) {
      try {
        this.client = new SecretManagerServiceClient();
      } catch (err: any) {
        this.logger.warn(
          `Failed to initialize SecretManagerServiceClient: ${err.message}.`,
        );
      }
    }
  }

  async getSecret(secretName: string): Promise<string | undefined> {
    if (!this.client || !this.projectId) return undefined;

    try {
      const name = `projects/${this.projectId}/secrets/${secretName}/versions/latest`;
      const [version] = await this.client.accessSecretVersion({ name });
      return version.payload?.data?.toString();
    } catch (error: any) {
      this.logger.warn(
        `Failed to fetch secret "${secretName}" from GCP Secret Manager: ${error.message}`,
      );
      return undefined;
    }
  }
}
