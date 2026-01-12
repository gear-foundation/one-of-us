import pg from 'pg';
import { CONFIG } from './config.js';

const { Pool } = pg;

const pool = new Pool({
  connectionString: CONFIG.DATABASE_URL,
});

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS members (
      id SERIAL PRIMARY KEY,
      address TEXT UNIQUE NOT NULL,
      tx_hash TEXT,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_address ON members(address);
    CREATE INDEX IF NOT EXISTS idx_joined_at ON members(joined_at);
  `);
}

export interface Member {
  id: number;
  address: string;
  tx_hash: string | null;
  joined_at: string;
}

export async function addMember(address: string, txHash?: string): Promise<boolean> {
  const normalizedAddress = address.toLowerCase();

  try {
    const result = await pool.query(
      `INSERT INTO members (address, tx_hash) VALUES ($1, $2) ON CONFLICT (address) DO NOTHING`,
      [normalizedAddress, txHash || null]
    );
    return (result.rowCount ?? 0) > 0;
  } catch {
    return false;
  }
}

export async function isMember(address: string): Promise<boolean> {
  const normalizedAddress = address.toLowerCase();
  const result = await pool.query('SELECT 1 FROM members WHERE address = $1', [normalizedAddress]);
  return result.rows.length > 0;
}

export async function getMember(address: string): Promise<Member | null> {
  const normalizedAddress = address.toLowerCase();
  const result = await pool.query('SELECT * FROM members WHERE address = $1', [normalizedAddress]);
  return result.rows[0] || null;
}

export async function getAllMembers(page = 0, pageSize = 100): Promise<Member[]> {
  const offset = page * pageSize;
  const result = await pool.query(
    'SELECT * FROM members ORDER BY joined_at DESC LIMIT $1 OFFSET $2',
    [pageSize, offset]
  );
  return result.rows;
}

export async function getMemberCount(): Promise<number> {
  const result = await pool.query('SELECT COUNT(*) as count FROM members');
  return parseInt(result.rows[0].count);
}

export async function updateMemberTxHash(address: string, txHash: string): Promise<boolean> {
  const normalizedAddress = address.toLowerCase();
  try {
    const result = await pool.query(
      'UPDATE members SET tx_hash = $1 WHERE address = $2',
      [txHash, normalizedAddress]
    );
    return (result.rowCount ?? 0) > 0;
  } catch {
    return false;
  }
}

export default pool;
