import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('❌ 缺少環境變數: DATABASE_URL');
}

const pool = new Pool({
  connectionString,
});

export const db = drizzle(pool);
