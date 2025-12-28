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

// Hoodi testnet configuration
export const HOODI_CHAIN_ID = 560048;
export const HOODI_CHAIN_ID_HEX = '0x88bb0' as const;
export const HOODI_EXPLORER_URL = 'https://hoodi.etherscan.io';
export const HOODI_RPC_URL = 'https://hoodi-reth-rpc.gear-tech.io';

// Hoodi network params for wallet_addEthereumChain
export const HOODI_NETWORK_PARAMS = {
  chainId: HOODI_CHAIN_ID_HEX,
  chainName: 'Hoodi Testnet',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: [HOODI_RPC_URL],
  blockExplorerUrls: [HOODI_EXPLORER_URL],
} as const;

// Zero address for read-only queries
export const ZERO_ADDRESS =
  '0x0000000000000000000000000000000000000000' as const;

export type HexAddress = `0x${string}`;

export const getTxExplorerUrl = (txHash: string): string =>
  `${HOODI_EXPLORER_URL}/tx/${txHash}`;

export const getAddressExplorerUrl = (address: string): string =>
  `${HOODI_EXPLORER_URL}/address/${address}`;

export const isHoodiNetwork = (chainId: number | null): boolean =>
  chainId === HOODI_CHAIN_ID;
