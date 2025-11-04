import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserMigration implements MigrationInterface {
  name = 'CreateUsers';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`users\` (
        \`Id\` char(36) NOT NULL DEFAULT (uuid()),
        \`password\` varchar(255) NOT NULL,
        \`email\` varchar(255) NOT NULL UNIQUE,
        \`firstName\` varchar(255) NOT NULL,
        \`lastName\` varchar(255) NOT NULL,
        \`bio\` varchar(255) NULL,
        \`isActive\` boolean NOT NULL DEFAULT true,
        \`role\` enum('USER','ADMIN') NOT NULL DEFAULT 'USER',
        \`image\` text NULL,
        PRIMARY KEY (\`Id\`)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`users\``);
  }
}
