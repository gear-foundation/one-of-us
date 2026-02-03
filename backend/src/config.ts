import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const CONFIG = {
  PORT: parseInt(process.env.BACKEND_PORT || '3001'),
  PROGRAM_ID: required('PROGRAM_ID') as `0x${string}`,
  DATABASE_URL: required('DATABASE_URL'),
  VARA_ETH_HTTP: process.env.VARA_ETH_HTTP || 'https://vara-eth-validator-1.gear-tech.io',
} as const;
