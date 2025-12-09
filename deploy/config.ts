import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

export const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
export const ROUTER_ADDRESS = process.env.ROUTER_ADDRESS as `0x${string}`;
export const WVARA_ADDRESS = process.env.WVARA_ADDRESS as `0x${string}`;
export const VARA_ETH_WS =
  process.env.VARA_ETH_WS || 'ws://vara-eth-validator-1.gear-tech.io:9944';
export const ETH_RPC = process.env.ETH_RPC!;
export const ETH_RPC_WS =
  process.env.ETH_RPC_WS || 'wss://hoodi-reth-rpc.gear-tech.io/ws';
export const CODE_ID = process.env.CODE_ID as `0x${string}` | undefined;
export const PROGRAM_ID = process.env.PROGRAM_ID as `0x${string}` | undefined;
export const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

export const IDL_PATH = '../target/wasm32-gear/release/one_of_us.idl';
export const WASM_PATH = '../target/wasm32-gear/release/one_of_us.opt.wasm';

export const HOODI_CHAIN_ID = 560048;
export const WVARA_TOP_UP_AMOUNT = BigInt(10 * 1e12);
