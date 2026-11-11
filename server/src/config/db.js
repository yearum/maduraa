import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool
  .query('SELECT NOW()')
  .then(() => console.log('✅ Database terhubung'))
  .catch((error) => console.error('❌ Gagal terhubung ke database:', error.message));

export default pool;
