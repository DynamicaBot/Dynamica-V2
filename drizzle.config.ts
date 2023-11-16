import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  //   schema: './src/db/schema.ts',
  out: './src/db/migrations',
  driver: 'better-sqlite',
  schema: './src/db/schema.ts',
  dbCredentials: {
    url: './config/db.sqlite',
  },
});
