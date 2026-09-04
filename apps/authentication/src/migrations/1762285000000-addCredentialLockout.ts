import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCredentialLockout1762285000000 implements MigrationInterface {
  name = 'AddCredentialLockout1762285000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`credentials\` ADD \`failedLoginCount\` int NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE \`credentials\` ADD \`lockedUntil\` datetime NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`credentials\` DROP COLUMN \`lockedUntil\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`credentials\` DROP COLUMN \`failedLoginCount\``,
    );
  }
}
