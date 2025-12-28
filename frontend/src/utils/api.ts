import { ENV } from '../config/env';

const API_BASE = ENV.API_URL;

interface Member {
  id: number;
  address: string;
  tx_hash: string | null;
  joined_at: string;
}

interface MemberInfo {
  isMember: boolean;
  member?: Member;
}

interface MemberCountResponse {
  count: number;
}

interface RegisterResponse {
  success: boolean;
  message: string;
  count: number;
}

export async function checkMember(address: string): Promise<MemberInfo> {
  try {
    const res = await fetch(`${API_BASE}/api/members/${address}`);
    if (!res.ok) throw new Error('Failed to check membership');
    return res.json();
  } catch {
    return { isMember: false };
  }
}

export async function registerMember(
  address: string,
  txHash?: string
): Promise<RegisterResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/api/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, txHash }),
    });
    if (!res.ok) throw new Error('Failed to register');
    return res.json();
  } catch {
    return null;
  }
}

export async function getMemberCount(): Promise<number | null> {
  try {
    const res = await fetch(`${API_BASE}/api/members/count`);
    if (!res.ok) throw new Error('Failed to get count');
    const data: MemberCountResponse = await res.json();
    return data.count;
  } catch {
    return null;
  }
}

export async function updateMemberTxHash(
  address: string,
  txHash: string
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/members/${address}/txHash`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txHash }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function isBackendAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
