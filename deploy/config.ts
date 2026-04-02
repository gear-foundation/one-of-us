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

const chainIdRaw = required('CHAIN_ID');
const chainId = Number(chainIdRaw);
if (!Number.isFinite(chainId)) {
  throw new Error(`Invalid CHAIN_ID: ${chainIdRaw}`);
}

export const NETWORK = required('NETWORK');
export const CHAIN_ID = chainId;
export const CHAIN_NAME = required('CHAIN_NAME');
export const CHAIN_NETWORK_NAME = required('CHAIN_NETWORK_NAME');
export const EXPLORER_URL = required('EXPLORER_URL');

export const PRIVATE_KEY = required('PRIVATE_KEY') as `0x${string}`;
export const ROUTER_ADDRESS = required('ROUTER_ADDRESS') as `0x${string}`;
export const WVARA_ADDRESS = required('WVARA_ADDRESS') as `0x${string}`;
export const VARA_ETH_WS = required('VARA_ETH_WS');
export const VARA_ETH_HTTP = required('VARA_ETH_HTTP');
export const ETH_RPC = required('ETH_RPC');
export const ETH_RPC_WS = required('ETH_RPC_WS');
export const CODE_ID = process.env.CODE_ID as `0x${string}` | undefined;
export const PROGRAM_ID = process.env.PROGRAM_ID as `0x${string}` | undefined;
export const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

export const IDL_PATH = '../target/wasm32-gear/release/one_of_us.idl';
export const WASM_PATH = '../target/wasm32-gear/release/one_of_us.opt.wasm';

export const WVARA_TOP_UP_AMOUNT = BigInt(1_000 * 1e12);
