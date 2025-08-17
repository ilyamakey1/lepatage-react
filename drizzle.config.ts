import type { Config } from 'drizzle-kit';

export default {
  schema: './database/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: 'file:./database/lepatage.db',
  },
} satisfies Config;