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

function decodeScaleCompactU32(hexPayload: string): number {
  // The response payload contains: [prefix][SCALE compact u32]
  // Prefix is the Count query payload, result follows
  
  // Remove 0x prefix if present
  const hex = hexPayload.startsWith('0x') ? hexPayload.slice(2) : hexPayload;
  
  // The prefix is the Count payload (without 0x): 1c4f6e654f66557314436f756e74
  const prefixLen = COUNT_PAYLOAD.length - 2; // Without 0x
  
  if (hex.length <= prefixLen) {
    return 0;
  }
  
  // Get the result portion after prefix
  const resultHex = hex.slice(prefixLen);
  
  if (resultHex.length < 2) {
    return 0;
  }
  
  // First byte determines encoding mode
  const firstByte = parseInt(resultHex.slice(0, 2), 16);
  const mode = firstByte & 0b11;
  
  // SCALE Compact encoding:
  // - Mode 00: single byte, value = byte >> 2 (values 0-63)
  // - Mode 01: two bytes LE, value = uint16 >> 2 (values 64-16383)
  // - Mode 10: four bytes LE, value = uint32 >> 2 (values 16384-1073741823)
  // - Mode 11: big integer (not used for u32)
  
  if (mode === 0b00) {
    // Single byte mode
    return firstByte >> 2;
  } else if (mode === 0b01) {
    // Two byte mode
    if (resultHex.length < 4) return 0;
    const byte0 = parseInt(resultHex.slice(0, 2), 16);
    const byte1 = parseInt(resultHex.slice(2, 4), 16);
    const value = (byte1 << 8) | byte0;
    return value >> 2;
  } else if (mode === 0b10) {
    // Four byte mode
    if (resultHex.length < 8) return 0;
    const bytes = [
      parseInt(resultHex.slice(0, 2), 16),
      parseInt(resultHex.slice(2, 4), 16),
      parseInt(resultHex.slice(4, 6), 16),
      parseInt(resultHex.slice(6, 8), 16),
    ];
    const value = (bytes[3] << 24) | (bytes[2] << 16) | (bytes[1] << 8) | bytes[0];
    return (value >> 2) >>> 0;
  }
  
  return 0;
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

    const count = decodeScaleCompactU32(response.result.payload);
    
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

