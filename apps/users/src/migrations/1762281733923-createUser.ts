import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUser1762281733923 implements MigrationInterface {
  name = 'CreateUser1762281733923';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS \`users\` (\`id\` varchar(36) NOT NULL, \`email\` varchar(255) NOT NULL, \`firstName\` varchar(255) NOT NULL, \`lastName\` varchar(255) NOT NULL, \`bio\` varchar(255) NULL, \`image\` text NULL, UNIQUE INDEX \`IDX_users_email\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`users\``);
  }
}
