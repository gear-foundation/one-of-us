const optionalEnv = (key: string): string | undefined => {
  const value = import.meta.env[key];
  return value ? String(value) : undefined;
};

type NetworkKey = 'mainnet' | 'hoodi';

type NetworkProfile = {
  chainName: string;
  chainId: number;
  explorerUrl: string;
  explorerLabel: string;
  ethRpc: string;
  routerAddress: `0x${string}`;
  wvaraAddress: `0x${string}`;
  programId: `0x${string}`;
  varaEthWs: string;
  varaEthHttp: string;
  varaEthWsPool: string[];
};

const NETWORKS: Record<NetworkKey, NetworkProfile> = {
  mainnet: {
    chainName: 'Ethereum',
    chainId: 1,
    explorerUrl: 'https://etherscan.io',
    explorerLabel: 'Etherscan',
    ethRpc: 'https://mainnet-reth-rpc.gear-tech.io',
    routerAddress: '0x9C13FE9242dfe2ba2Cd446480A9308279aA74cb6',
    wvaraAddress: '0xB67010F2246814e5c39593ac23A925D9e9d7E5aD',
    programId: '0x6286a1f8ebbd8b7d2ab75321f3f00b507d5ecc01',
    varaEthWs: 'wss://validator-1-eth.vara.network',
    varaEthHttp: 'https://validator-1-eth.vara.network',
    varaEthWsPool: [
      'wss://validator-1-eth.vara.network',
      'wss://validator-2-eth.vara.network',
      'wss://validator-3-eth.vara.network',
      'wss://validator-4-eth.vara.network',
    ],
  },
  hoodi: {
    chainName: 'Ethereum Hoodi',
    chainId: 560048,
    explorerUrl: 'https://hoodi.etherscan.io',
    explorerLabel: 'Hoodi Etherscan',
    ethRpc: 'https://hoodi-reth-rpc.gear-tech.io',
    routerAddress: '0xE549b0AfEdA978271FF7E712232B9F7f39A0b060',
    wvaraAddress: '0xE1ab85A8B4d5d5B6af0bbD0203EB322DF33d0464',
    // Test contract (no-uniqueness JoinUs, counter grows per send) — see app/src/lib.rs v12.
    programId: '0x84e30671f75d43e03f25d0ee2a4f81f7f7715fbc',
    varaEthWs: 'wss://vara-eth-validator-1.gear-tech.io',
    varaEthHttp: 'https://vara-eth-validator-1.gear-tech.io',
    varaEthWsPool: [
      'wss://vara-eth-validator-1.gear-tech.io',
      'wss://vara-eth-validator-2.gear-tech.io',
      'wss://vara-eth-validator-3.gear-tech.io',
      'wss://vara-eth-validator-4.gear-tech.io',
    ],
  },
};

const resolveNetwork = (value: string | undefined): NetworkKey => {
  const normalized = (value ?? '').trim().toLowerCase();
  return normalized === 'hoodi' ? 'hoodi' : 'mainnet';
};

// The network the build was configured for (VITE_* overrides only apply to this one).
const BUILD_NETWORK = resolveNetwork(optionalEnv('VITE_NETWORK'));

const ACTIVE_NETWORK_KEY = 'oou-active-network';

const getStoredNetwork = (): NetworkKey | null => {
  try {
    const v = localStorage.getItem(ACTIVE_NETWORK_KEY);
    return v === 'mainnet' || v === 'hoodi' ? v : null;
  } catch {
    return null;
  }
};

// Active network: runtime toggle (localStorage) wins, else the build's network.
const network = getStoredNetwork() ?? BUILD_NETWORK;
const profile = NETWORKS[network];

// VITE_* overrides are only honoured for the network the build targeted; when the
// user toggles to the other network we fall back to that network's static profile.
const ov = (key: string, profileValue: string): string =>
  (network === BUILD_NETWORK ? optionalEnv(key) : undefined) ?? profileValue;

export const ENV = {
  NETWORK: network,
  IS_TESTNET: network === 'hoodi',
  CHAIN_ID: profile.chainId,
  CHAIN_NAME: profile.chainName,
  CHAIN_ID_HEX: `0x${profile.chainId.toString(16)}` as `0x${string}`,
  EXPLORER_URL: ov('VITE_EXPLORER_URL', profile.explorerUrl),
  EXPLORER_LABEL: ov('VITE_EXPLORER_LABEL', profile.explorerLabel),
  ETH_RPC: ov('VITE_ETH_RPC', profile.ethRpc),
  ROUTER_ADDRESS: ov('VITE_ROUTER_ADDRESS', profile.routerAddress) as `0x${string}`,
  PROGRAM_ID: ov('VITE_PROGRAM_ID', profile.programId) as `0x${string}`,
  WVARA_ADDRESS: ov('VITE_WVARA_ADDRESS', profile.wvaraAddress) as `0x${string}`,
  VARA_ETH_WS: ov('VITE_VARA_ETH_WS', profile.varaEthWs),
  VARA_ETH_HTTP: ov('VITE_VARA_ETH_HTTP', profile.varaEthHttp),
  VARA_ETH_WS_POOL: profile.varaEthWsPool,
  API_URL: optionalEnv('VITE_API_URL') ?? 'http://localhost:3001',
} as const;

export type { NetworkKey };

export const ACTIVE_NETWORK: NetworkKey = network;

// Switch the active network and reload so all providers re-init against it.
export const setActiveNetwork = (key: NetworkKey): void => {
  try {
    if (key === BUILD_NETWORK) {
      localStorage.removeItem(ACTIVE_NETWORK_KEY);
    } else {
      localStorage.setItem(ACTIVE_NETWORK_KEY, key);
    }
  } catch {
    // ignore storage errors
  }
  window.location.reload();
};
