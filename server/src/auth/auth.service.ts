import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../database';
import { config } from '../config';
import { HttpError } from '../middleware/error.middleware';
import { moduleRegistry } from '../modules/registry';

interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  full_name: string;
  role: string;
}

export interface AuthUser {
  id: number;
  username: string;
  fullName: string;
  role: string;
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}

function toAuthUser(row: UserRow): AuthUser {
  return { id: row.id, username: row.username, fullName: row.full_name, role: row.role };
}

export async function login(username: string, password: string): Promise<LoginResult> {
  if (!username || !password) {
    throw new HttpError(400, 'Username and password are required');
  }

  const rows = await query<UserRow>('SELECT * FROM users WHERE username = $1', [username]);
  const row = rows[0];
  if (!row || !(await bcrypt.compare(password, row.password_hash))) {
    throw new HttpError(401, 'Invalid username or password');
  }

  const user = toAuthUser(row);
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, config.jwtSecret, {
    expiresIn: '12h',
  });
  return { token, user };
}

export async function getUserById(userId: number): Promise<AuthUser | null> {
  const rows = await query<UserRow>('SELECT * FROM users WHERE id = $1', [userId]);
  return rows[0] ? toAuthUser(rows[0]) : null;
}

export async function getEnabledModuleIds(userId: number): Promise<string[]> {
  const rows = await query<{ module_id: string }>(
    'SELECT module_id FROM user_modules WHERE user_id = $1 AND enabled = true',
    [userId],
  );
  return rows.map((row) => row.module_id);
}

async function upsertUserModule(userId: number, moduleId: string, enabled: boolean): Promise<void> {
  await query(
    `INSERT INTO user_modules (user_id, module_id, enabled)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, module_id) DO UPDATE SET enabled = $3, enabled_at = NOW()`,
    [userId, moduleId, enabled],
  );
}

/**
 * Enables/disables a module for a user. Enabling a module that depends on a
 * disabled one auto-enables the dependency too (per the spec's edge case) —
 * the list of ids that got auto-enabled is returned so the UI can notify
 * the user why something else just lit up.
 */
export async function setModuleEnabled(
  userId: number,
  moduleId: string,
  enabled: boolean,
): Promise<string[]> {
  const autoEnabled: string[] = [];
  if (enabled) {
    const moduleDef = moduleRegistry.get(moduleId);
    for (const dependencyId of moduleDef?.dependencies ?? []) {
      await upsertUserModule(userId, dependencyId, true);
      autoEnabled.push(dependencyId);
    }
  }
  await upsertUserModule(userId, moduleId, enabled);
  return autoEnabled;
}
