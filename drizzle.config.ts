import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config();

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/features/drizzle/schema.ts',
  dbCredentials: {
    url: process.env.POSTGRES_URL,
  },
});
