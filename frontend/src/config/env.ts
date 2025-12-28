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

export const ENV = {
  ROUTER_ADDRESS: required('VITE_ROUTER_ADDRESS') as `0x${string}`,
  PROGRAM_ID: required('VITE_PROGRAM_ID') as `0x${string}`,
  WVARA_ADDRESS: required('VITE_WVARA_ADDRESS') as `0x${string}`,
  VARA_ETH_WS: required('VITE_VARA_ETH_WS'),
  VARA_ETH_HTTP: optional(
    'VITE_VARA_ETH_HTTP',
    'https://hoodi-reth-rpc.gear-tech.io'
  ),
  API_URL: optional('VITE_API_URL', 'http://localhost:3001'),
} as const;
