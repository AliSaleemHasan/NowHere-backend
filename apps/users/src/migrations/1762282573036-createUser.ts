import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUser1762282573036 implements MigrationInterface {
  name = 'CreateUser1762282573036';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS \`settings\` (\`id\` varchar(36) NOT NULL, \`maxDistance\` int NOT NULL DEFAULT 10000, \`newSnapDistance\` int NOT NULL DEFAULT 1000, \`snapDisappearTime\` int NOT NULL DEFAULT 1, \`userId\` varchar(36) NOT NULL, UNIQUE INDEX \`IDX_settings_user\` (\`userId\`), PRIMARY KEY (\`id\`), CONSTRAINT \`FK_settings_user\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS \`snap_seen\` (\`userId\` varchar(64) NOT NULL, \`snapId\` varchar(24) NOT NULL, \`seenAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_user_seen_at\` (\`userId\`, \`seenAt\`), PRIMARY KEY (\`userId\`, \`snapId\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`snap_seen\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`settings\``);
  }
}
