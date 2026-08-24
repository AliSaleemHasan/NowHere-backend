import { Global, Module } from '@nestjs/common';
import { SecretManagerService } from './secret-manager.service';
import {
  SECRETS_STRATEGY,
  GCPSecretsStrategy,
  AWSSecretsStrategy,
  EnvSecretsStrategy,
} from './';

@Global()
@Module({
  providers: [
    {
      provide: SECRETS_STRATEGY,
      useFactory: () => {
        const provider = (
          process.env.SECRETS_PROVIDER ||
          process.env.SECRET_PROVIDER ||
          (process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT
            ? 'gcp'
            : process.env.AWS_REGION && process.env.AWS_SECRET_ACCESS_KEY
              ? 'aws'
              : 'env')
        ).toLowerCase();

        if (provider === 'gcp' || provider === 'google') {
          return new GCPSecretsStrategy();
        }
        if (provider === 'aws' || provider === 'amazon') {
          return new AWSSecretsStrategy();
        }
        return new EnvSecretsStrategy();
      },
    },
    SecretManagerService,
  ],
  exports: [SecretManagerService, SECRETS_STRATEGY],
})
export class SecretManagerModule {}
