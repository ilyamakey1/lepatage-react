import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema.js';

const client = createClient({
  url: 'file:./database/lepatage.db'
});

export const db = drizzle(client, { schema });

export type DB = typeof db;