import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCredentials1762284000000 implements MigrationInterface {
  name = 'CreateCredentials1762284000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS \`credentials\` (\`id\` varchar(36) NOT NULL, \`password\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`role\` enum ('ADMIN', 'USER') NOT NULL DEFAULT 'USER', \`lastLoginAt\` datetime NULL, UNIQUE INDEX \`IDX_credentials_email\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    // If a previous numeric enum stored 0/1, convert once:
    // UPDATE credentials SET role = IF(role = '0', 'ADMIN', 'USER') WHERE role IN ('0','1');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`credentials\``);
  }
}
