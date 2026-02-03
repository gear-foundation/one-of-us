import { CONFIG } from './config.js';

// Pre-encoded payload for OneOfUs.Count query
const COUNT_PAYLOAD = '0x1c4f6e654f66557314436f756e74';

// Zero address (20 bytes) for source parameter  
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

// Cache for member count
let cachedCount: number | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 2_000; // 2 seconds

interface JsonRpcResponse {
  jsonrpc: string;
  id: number;
  result?: {
    payload: string;
    value: number;
    code: string;
  };
  error?: {
    code: number;
    message: string;
    data?: string;
  };
}

async function callVaraEthRpc(method: string, params: Record<string, unknown>): Promise<JsonRpcResponse> {
  const response = await fetch(CONFIG.VARA_ETH_HTTP, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method,
      params,
      id: 1,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  return response.json();
}

function decodeU32Le(hexPayload: string): number {
  // The response payload contains: [prefix][u32 little-endian]
  // Prefix is the Count query payload, result follows

  const hex = hexPayload.startsWith('0x') ? hexPayload.slice(2) : hexPayload;
  const prefixLen = COUNT_PAYLOAD.length - 2; // Without 0x

  if (hex.length < prefixLen + 8) {
    return 0;
  }

  // Take the last 4 bytes as u32 LE
  const u32Hex = hex.slice(-8);
  const bytes = u32Hex.match(/.{2}/g);
  if (!bytes || bytes.length !== 4) {
    return 0;
  }

  const value = bytes
    .reverse()
    .reduce((acc, byte) => (acc << 8) | parseInt(byte, 16), 0);

  return value >>> 0;
}

export async function getBlockchainMemberCount(): Promise<number> {
  const now = Date.now();
  
  // Return cached value if still valid
  if (cachedCount !== null && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedCount;
  }

  try {
    const response = await callVaraEthRpc('program_calculateReplyForHandle', {
      source: ZERO_ADDRESS,
      program_id: CONFIG.PROGRAM_ID,
      payload: COUNT_PAYLOAD,
      value: 0,
    });

    if (response.error) {
      console.error('RPC error:', response.error.message);
      // Return cached value on error, or 0 if no cache
      return cachedCount ?? 0;
    }

    if (!response.result?.payload) {
      console.error('No payload in response');
      return cachedCount ?? 0;
    }

    const count = decodeU32Le(response.result.payload);
    
    // Update cache
    cachedCount = count;
    cacheTimestamp = now;
    
    console.log(`Blockchain member count: ${count} (cached for ${CACHE_TTL_MS}ms)`);
    return count;
  } catch (error) {
    console.error('Failed to fetch blockchain count:', error);
    // Return cached value on error, or 0 if no cache
    return cachedCount ?? 0;
  }
}

