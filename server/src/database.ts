import { Pool, type QueryResultRow } from 'pg';
import { config } from './config';

/**
 * Shared connection pool. Every module repository imports `query()` from
 * here — nobody talks to `pg` directly.
 */
export const pool = new Pool({
  connectionString: config.databaseUrl,
});

/**
 * Thin helper around pool.query that returns just the rows, typed. Repository
 * files use this for every raw, parameterized SQL statement.
 *
 * @example
 * const rows = await query<Customer>(
 *   'SELECT * FROM customers WHERE is_active = $1 ORDER BY name',
 *   [true],
 * );
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const result = await pool.query<T>(text, params);
  return result.rows;
}
