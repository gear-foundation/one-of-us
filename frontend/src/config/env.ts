const required = (key: string): string => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing env: ${key}`);
  }
  return value;
};

const optional = (key: string, defaultValue: string): string => {
  return import.meta.env[key] || defaultValue;
};

type NetworkKey = 'mainnet' | 'hoodi';

type NetworkProfile = {
  chainId: number;
  explorerUrl: string;
  explorerLabel: string;
  ethRpc: string;
  routerAddress: `0x${string}`;
  wvaraAddress: `0x${string}`;
  varaEthWs: string;
  varaEthHttp: string;
};

const NETWORKS: Record<NetworkKey, NetworkProfile> = {
  mainnet: {
    chainId: 1,
    explorerUrl: 'https://etherscan.io',
    explorerLabel: 'Etherscan',
    ethRpc: 'https://mainnet-reth-rpc.gear-tech.io',
    routerAddress: '0x9C13FE9242dfe2ba2Cd446480A9308279aA74cb6',
    wvaraAddress: '0xB67010F2246814e5c39593ac23A925D9e9d7E5aD',
    varaEthWs: 'wss://validator-1-eth.vara.network',
    varaEthHttp: 'https://mainnet-reth-rpc.gear-tech.io',
  },
  hoodi: {
    chainId: 560048,
    explorerUrl: 'https://hoodi.etherscan.io',
    explorerLabel: 'Hoodi Etherscan',
    ethRpc: 'https://hoodi-reth-rpc.gear-tech.io',
    routerAddress: '0xE549b0AfEdA978271FF7E712232B9F7f39A0b060',
    wvaraAddress: '0xE1ab85A8B4d5d5B6af0bbD0203EB322DF33d0464',
    varaEthWs: 'wss://vara-eth-validator-1.gear-tech.io',
    varaEthHttp: 'https://hoodi-reth-rpc.gear-tech.io',
  },
};

const resolveNetwork = (value: string): NetworkKey => {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'mainnet' || normalized === 'hoodi') {
    return normalized;
  }
  throw new Error(`Invalid VITE_NETWORK: ${value}. Use "mainnet" or "hoodi".`);
};

const network = resolveNetwork(optional('VITE_NETWORK', 'mainnet'));
const profile = NETWORKS[network];

export const ENV = {
  NETWORK: network,
  CHAIN_ID: profile.chainId,
  CHAIN_NAME: 'Ethereum',
  CHAIN_ID_HEX: `0x${profile.chainId.toString(16)}` as `0x${string}`,
  EXPLORER_URL: optional('VITE_EXPLORER_URL', profile.explorerUrl),
  EXPLORER_LABEL: optional('VITE_EXPLORER_LABEL', profile.explorerLabel),
  ETH_RPC: optional('VITE_ETH_RPC', profile.ethRpc),
  ROUTER_ADDRESS: optional('VITE_ROUTER_ADDRESS', profile.routerAddress) as `0x${string}`,
  PROGRAM_ID: required('VITE_PROGRAM_ID') as `0x${string}`,
  WVARA_ADDRESS: optional('VITE_WVARA_ADDRESS', profile.wvaraAddress) as `0x${string}`,
  VARA_ETH_WS: optional('VITE_VARA_ETH_WS', profile.varaEthWs),
  VARA_ETH_HTTP: optional('VITE_VARA_ETH_HTTP', profile.varaEthHttp),
  API_URL: optional('VITE_API_URL', 'http://localhost:3001'),
} as const;
