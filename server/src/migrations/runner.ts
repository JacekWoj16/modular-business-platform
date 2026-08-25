import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pool } from '../database';

/**
 * Minimal migration runner: executes every *.sql file in this directory, in
 * filename order (hence the numeric prefixes), inside a transaction, and
 * records what's been applied in `schema_migrations` so re-running is safe.
 *
 * Deliberately dumb by design — no up/down pairs, no rollback tooling. This
 * is a demo project; a forward-only runner is all the architecture needs to
 * prove out.
 */

const MIGRATIONS_DIR = __dirname;

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const { rows } = await pool.query<{ filename: string }>(
    'SELECT filename FROM schema_migrations',
  );
  return new Set(rows.map((row) => row.filename));
}

async function runMigrations(): Promise<void> {
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`skip   ${file} (already applied)`);
      continue;
    }

    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`applied ${file}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Migration "${file}" failed: ${(error as Error).message}`, { cause: error });
    } finally {
      client.release();
    }
  }
}

runMigrations()
  .then(() => {
    console.log('Migrations complete.');
    return pool.end();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await pool.end();
    process.exitCode = 1;
  });
