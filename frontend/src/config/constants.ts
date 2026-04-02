import { ENV } from './env';

export const GITHUB_REPO_URL = 'https://github.com/gear-foundation/one-of-us';

export const SLOGANS = [
  { text: 'STOP FRAGMENTING', highlight: 'STOP' },
  { text: 'STOP BRIDGING', highlight: 'STOP' },
  { text: 'STOP COMPLICATING', highlight: 'STOP' },
  { text: 'STOP SACRIFICING', highlight: 'STOP' },
  { text: 'START BUILDING', highlight: 'START' },
] as const;

export const SLOGAN_INTERVAL_MS = 2000;
export const MEMBER_COUNT_REFRESH_MS = 10000;

// Active network values are read from Vite env.
export const TARGET_CHAIN_ID = ENV.CHAIN_ID;
export const TARGET_CHAIN_ID_HEX = ENV.CHAIN_ID_HEX;
export const TARGET_EXPLORER_URL = ENV.EXPLORER_URL;
export const TARGET_EXPLORER_LABEL = ENV.EXPLORER_LABEL;
export const TARGET_RPC_URL = ENV.ETH_RPC;
export const TARGET_NETWORK_NAME = ENV.CHAIN_NAME;

// Network params for wallet_addEthereumChain fallback
export const TARGET_NETWORK_PARAMS = {
  chainId: TARGET_CHAIN_ID_HEX,
  chainName: TARGET_NETWORK_NAME,
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: [TARGET_RPC_URL],
  blockExplorerUrls: [TARGET_EXPLORER_URL],
} as const;

// Zero address for read-only queries
export const ZERO_ADDRESS =
  '0x0000000000000000000000000000000000000000' as const;

export type HexAddress = `0x${string}`;

export const getTxExplorerUrl = (txHash: string): string =>
  `${TARGET_EXPLORER_URL}/tx/${txHash}`;

export const getAddressExplorerUrl = (address: string): string =>
  `${TARGET_EXPLORER_URL}/address/${address}`;

export const isExpectedNetwork = (chainId: number | null): boolean =>
  chainId === TARGET_CHAIN_ID;
