export const SECRETS_STRATEGY = 'SECRETS_STRATEGY';

export interface SecretsStrategy {
  getSecret(secretName: string): Promise<string | undefined>;
}
