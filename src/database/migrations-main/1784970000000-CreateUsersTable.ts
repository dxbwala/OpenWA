import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the `users` table on the main (always-SQLite) connection for
 * dashboard username/password login. Idempotent for DBs previously created
 * by synchronize=true.
 */
export class CreateUsersTable1784970000000 implements MigrationInterface {
  name = 'CreateUsersTable1784970000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "users" (` +
        `"id" varchar PRIMARY KEY NOT NULL, ` +
        `"username" varchar(64) NOT NULL, ` +
        `"passwordHash" varchar(255) NOT NULL, ` +
        `"role" varchar(20) NOT NULL DEFAULT ('admin'), ` +
        `"isActive" boolean NOT NULL DEFAULT (1), ` +
        `"lastLoginAt" datetime, ` +
        `"createdAt" datetime NOT NULL DEFAULT (datetime('now')), ` +
        `"updatedAt" datetime NOT NULL DEFAULT (datetime('now'))` +
        `)`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_users_username" ON "users" ("username")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_username"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
