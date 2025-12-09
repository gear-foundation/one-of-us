/**
 * Environment configuration
 * Reads from Vite environment variables
 */

export const ENV = {
  ROUTER_ADDRESS: (import.meta.env.VITE_ROUTER_ADDRESS ||
    '0x579D6098197517140e5aec47c78d6f7181916dd6') as `0x${string}`,
  PROGRAM_ID: (import.meta.env.VITE_PROGRAM_ID ||
    '0xe1e91aaa2e33dcb5472abda548a875fc955d2c95') as `0x${string}`,
  WVARA_ADDRESS: (import.meta.env.VITE_WVARA_ADDRESS ||
    '0x7e01A323534AA027Ac3aD17e7DBf8C90d4FFEf8e') as `0x${string}`,
  VARA_ETH_HTTP:
    import.meta.env.VITE_VARA_ETH_HTTP || 'https://hoodi-reth-rpc.gear-tech.io',
  VARA_ETH_WS:
    import.meta.env.VITE_VARA_ETH_WS || 'wss://hoodi-reth-rpc.gear-tech.io/ws',
} as const;

