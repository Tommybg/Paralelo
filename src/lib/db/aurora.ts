import { Pool, PoolConfig } from 'pg';

const poolConfig: PoolConfig = {
  host: process.env.AURORA_HOST,
  port: parseInt(process.env.AURORA_PORT || '5432'),
  database: process.env.AURORA_DATABASE,
  user: process.env.AURORA_USER,
  password: process.env.AURORA_PASSWORD,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Create connection pool
export const pool = new Pool(poolConfig);

// Test connection function
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Aurora PostgreSQL connected successfully:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('❌ Aurora PostgreSQL connection failed:', error);
    return false;
  }
};

// Generic query function
export const query = async (text: string, params?: any[]) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

// Transaction helper
export const withTransaction = async (callback: (client: any) => Promise<any>) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}; 