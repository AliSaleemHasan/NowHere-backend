import { EnvReader } from './mysql.config';

export function buildMongoUri(config: EnvReader): string {
  const explicit = config.get<string>('MONGO_URI');
  if (explicit) {
    return explicit;
  }

  const user = encodeURIComponent(
    config.get<string>('MONGO_ROOT_USER', 'root'),
  );
  const password = encodeURIComponent(
    config.get<string>('MONGO_ROOT_PASS', 'root'),
  );
  const host = config.get<string>('MONGO_HOST', 'mongodb');
  const port = config.get<number | string>('MONGO_PORT', 27017);
  const database = config.get<string>('MONGO_DATABASE', 'snaps');

  return `mongodb://${user}:${password}@${host}:${port}/${database}?authSource=admin`;
}
