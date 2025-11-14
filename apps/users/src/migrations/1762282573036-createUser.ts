import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUser1762282573036 implements MigrationInterface {
    name = 'CreateUser1762282573036'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`users\` (\`Id\` varchar(36) NOT NULL, \`password\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`firstName\` varchar(255) NOT NULL, \`lastName\` varchar(255) NOT NULL, \`bio\` varchar(255) NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`role\` enum ('USER', 'ADMIN') NOT NULL DEFAULT 'USER', \`image\` text NULL, UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`Id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
    }

}
