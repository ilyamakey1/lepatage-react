import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema.js';

/** Локально: file:./database/lepatage.db. На Fly.io: file:/data/lepatage.db (том). Turso: https://... + DATABASE_AUTH_TOKEN */
const url = process.env.DATABASE_URL || 'file:./database/lepatage.db';
const authToken = process.env.DATABASE_AUTH_TOKEN;

const client = createClient(
  authToken ? { url, authToken } : { url }
);

export const db = drizzle(client, { schema });

export type DB = typeof db;