import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

pool.on('connect', () => {
  console.log('[DB] New client connected to pool');
});

export const db = drizzle(pool, { schema });

export async function initializeDatabase() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('NyayaVighya database connection established successfully');
    return true;
  } catch (error) {
    console.error('Failed to connect to NyayaVighya database:', error);
    return false;
  }
}

export async function closeDatabase() {
  await pool.end();
  console.log('Database pool closed');
}

export { schema };
export * from './schema';
