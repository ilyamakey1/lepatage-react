import jwt from 'jsonwebtoken';
import { db } from '../../database/db.js';
import { users } from '../../database/schema.js';
import { eq } from 'drizzle-orm';

export type AuthUser = {
  id: number;
  email: string;
  isAdmin: boolean;
};

/** JWT secret: обязателен в production (иначе процесс не стартует). */
export function getJwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  return s || 'dev-only-change-me';
}

export async function getUserFromAuthHeader(
  authHeader: string | undefined
): Promise<AuthUser | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: number };
    const row = await db
      .select({
        id: users.id,
        email: users.email,
        isAdmin: users.isAdmin,
      })
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);
    if (!row.length) return null;
    return {
      id: row[0].id,
      email: row[0].email,
      isAdmin: !!row[0].isAdmin,
    };
  } catch {
    return null;
  }
}
