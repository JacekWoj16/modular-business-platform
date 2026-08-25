import 'dotenv/config';

function readEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  // Matches docker-compose.yml's mapped port (15433 -> 5432) and credentials.
  databaseUrl: readEnv(
    'DATABASE_URL',
    'postgres://modular_app:modular_dev@localhost:15433/modular_app',
  ),
  // Demo-only default; override via .env for anything beyond local dev.
  jwtSecret: readEnv('JWT_SECRET', 'dev-secret-change-me'),
};
