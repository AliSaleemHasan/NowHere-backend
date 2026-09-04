import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePasswordResetTokens1762286000000
  implements MigrationInterface
{
  name = 'CreatePasswordResetTokens1762286000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS \`password_reset_tokens\` (\`id\` varchar(36) NOT NULL, \`userId\` varchar(64) NOT NULL, \`tokenHash\` varchar(64) NOT NULL, \`expiresAt\` datetime NOT NULL, \`usedAt\` datetime NULL, UNIQUE INDEX \`IDX_password_reset_tokens_tokenHash\` (\`tokenHash\`), INDEX \`IDX_password_reset_tokens_userId\` (\`userId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`password_reset_tokens\``);
  }
}
