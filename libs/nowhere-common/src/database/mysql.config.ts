import * as path from 'path';

/**
 * Structural subset of Nest ConfigService.get() so this helper stays
 * decoupled from @nestjs/config while remaining generic.
 */
export interface EnvReader {
  get<T = string>(key: string): T | undefined;
  get<T = string>(key: string, defaultValue: T): T;
}

/** Constructable TypeORM entity class. */
export type TypeOrmEntityClass<T extends object = object> = new (
  ...args: never[]
) => T;

export interface MysqlConnectionSettings {
  readonly type: 'mysql';
  readonly host: string;
  readonly port: number;
  readonly username: string;
  readonly password: string;
  readonly database: string;
  readonly synchronize: boolean;
  readonly migrations: string[];
}

export interface MysqlTypeOrmSettings<TEntity extends object = object>
  extends MysqlConnectionSettings {
  readonly entities: TypeOrmEntityClass<TEntity>[];
  readonly autoLoadEntities: boolean;
  readonly migrationsRun: boolean;
}

export interface MysqlDataSourceSettings<TEntity extends object = object>
  extends MysqlConnectionSettings {
  readonly entities: TypeOrmEntityClass<TEntity>[];
}

export interface MysqlTypeOrmConfigOptions<TEntity extends object = object> {
  entities?: readonly TypeOrmEntityClass<TEntity>[];
  migrationsDir: string;
  defaultDatabase?: string;
}

export interface MysqlCliDataSourceOptions<TEntity extends object = object> {
  entities: readonly TypeOrmEntityClass<TEntity>[];
  migrationsDir: string;
}

function readString(config: EnvReader, key: string, fallback: string): string {
  return config.get<string>(key, fallback) ?? fallback;
}

function readNumber(config: EnvReader, key: string, fallback: number): number {
  const raw = config.get<number | string>(key, fallback);
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mysqlBaseSettings(source: {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  synchronize: boolean;
  migrationsDir: string;
}): MysqlConnectionSettings {
  return {
    type: 'mysql',
    host: source.host,
    port: source.port,
    username: source.username,
    password: source.password,
    database: source.database,
    synchronize: source.synchronize,
    migrations: [path.join(source.migrationsDir, '*{.ts,.js}')],
  };
}

export function mysqlTypeOrmConfig<TEntity extends object = object>(
  config: EnvReader,
  options: MysqlTypeOrmConfigOptions<TEntity>,
): MysqlTypeOrmSettings<TEntity> {
  const synchronize = config.get<string>('TYPEORM_SYNC') === 'true';
  return {
    ...mysqlBaseSettings({
      host: readString(config, 'MYSQL_HOST', 'mysql'),
      port: readNumber(config, 'MYSQL_PORT', 3306),
      username: readString(config, 'MYSQL_USER', 'root'),
      password: readString(config, 'MYSQL_PASS', 'root'),
      database: readString(
        config,
        'MYSQL_DATABASE',
        options.defaultDatabase ?? '',
      ),
      synchronize,
      migrationsDir: options.migrationsDir,
    }),
    entities: [...(options.entities ?? [])],
    autoLoadEntities: true,
    migrationsRun: !synchronize,
  };
}

export function mysqlCliDataSourceConfig<TEntity extends object = object>(
  options: MysqlCliDataSourceOptions<TEntity>,
): MysqlDataSourceSettings<TEntity> {
  return {
    ...mysqlBaseSettings({
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: Number(process.env.MYSQL_PORT) || 3306,
      username: process.env.MYSQL_USER ?? '',
      password: process.env.MYSQL_PASS ?? '',
      database: process.env.MYSQL_DATABASE ?? '',
      synchronize: false,
      migrationsDir: options.migrationsDir,
    }),
    entities: [...options.entities],
  };
}
