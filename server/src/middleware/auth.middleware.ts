import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { HttpError } from './error.middleware';

export interface AuthenticatedUser {
  id: number;
  username: string;
  role: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/** Verifies the Bearer JWT and attaches the decoded user to `req.user`. Synchronous — Express catches the thrown HttpError itself, no asyncHandler needed. */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new HttpError(401, 'Missing or invalid Authorization header');
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthenticatedUser;
    req.user = { id: payload.id, username: payload.username, role: payload.role };
    next();
  } catch {
    throw new HttpError(401, 'Invalid or expired token');
  }
}
