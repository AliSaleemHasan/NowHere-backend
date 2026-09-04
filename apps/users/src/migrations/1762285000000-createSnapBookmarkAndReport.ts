import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSnapBookmarkAndReport1762285000000
  implements MigrationInterface
{
  name = 'CreateSnapBookmarkAndReport1762285000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS \`snap_bookmark\` (\`userId\` varchar(64) NOT NULL, \`snapId\` varchar(24) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`userId\`, \`snapId\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS \`snap_report\` (\`userId\` varchar(64) NOT NULL, \`snapId\` varchar(24) NOT NULL, \`reason\` varchar(32) NOT NULL, \`details\` varchar(1000) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`userId\`, \`snapId\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`snap_report\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`snap_bookmark\``);
  }
}
