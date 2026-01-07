import { useState, useEffect, useCallback, useRef } from 'react';
import { VaraEthApi } from '@vara-eth/api';
import { Sails } from 'sails-js';
import { type PublicClient } from 'viem';
import { ENV } from '../config/env';
import { registerMember, checkMember, updateMemberTxHash } from '../utils/api';

// StateChanged event ABI for Mirror contract
const STATE_CHANGED_EVENT = {
  type: 'event',
  name: 'StateChanged',
  inputs: [{ name: 'stateHash', type: 'bytes32', indexed: false }],
} as const;

// localStorage key for pending join state
const PENDING_JOIN_KEY = 'one-of-us-pending-join';

interface PendingJoin {
  address: string;
  timestamp: number;
}

// Save pending join to localStorage
function savePendingJoin(address: string) {
  const pending: PendingJoin = { address: address.toLowerCase(), timestamp: Date.now() };
  localStorage.setItem(PENDING_JOIN_KEY, JSON.stringify(pending));
}

// Get pending join from localStorage (valid for 10 minutes)
function getPendingJoin(): PendingJoin | null {
  try {
    const data = localStorage.getItem(PENDING_JOIN_KEY);
    if (!data) return null;
    const pending: PendingJoin = JSON.parse(data);
    // Expire after 10 minutes
    if (Date.now() - pending.timestamp > 10 * 60 * 1000) {
      localStorage.removeItem(PENDING_JOIN_KEY);
      return null;
    }
    return pending;
  } catch {
    return null;
  }
}

// Clear pending join from localStorage
function clearPendingJoin() {
  localStorage.removeItem(PENDING_JOIN_KEY);
}

export type TxStatus = 'idle' | 'signing' | 'confirming' | 'success' | 'error';

export const useJoinProgram = (
  varaApi: VaraEthApi | null,
  sails: Sails | null,
  address: string | null,
  isConnected: boolean,
  publicClient: PublicClient | null,
  onOptimisticJoin?: () => void
) => {
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [finalized, setFinalized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [checkingMembership, setCheckingMembership] = useState(false);
  const unwatchRef = useRef<(() => void) | null>(null);

  // Start watching for StateChanged event
  const startWatchingFinalization = useCallback(() => {
    if (!publicClient || !address || unwatchRef.current) return;

    const userAddress = address;
    unwatchRef.current = publicClient.watchContractEvent({
      address: ENV.PROGRAM_ID,
      abi: [STATE_CHANGED_EVENT],
      eventName: 'StateChanged',
      onLogs: (logs) => {
        if (logs.length > 0) {
          const log = logs[0];
          const hash = log.transactionHash;
          setTxHash(hash);
          setFinalized(true);
          setTxStatus('success');
          setLoading(false);
          clearPendingJoin(); // Clear localStorage on finalization
          unwatchRef.current?.();
          unwatchRef.current = null;
          updateMemberTxHash(userAddress, hash);
        }
      },
    });

    // Cleanup after 5 minutes max
    setTimeout(() => {
      if (unwatchRef.current) {
        unwatchRef.current();
        unwatchRef.current = null;
        setFinalized(true);
        setTxStatus('success');
        setLoading(false);
        clearPendingJoin();
      }
    }, 300000);
  }, [publicClient, address]);

  const checkMembership = useCallback(async () => {
    if (!address || !isConnected) return;

    setCheckingMembership(true);
    try {
      // First check localStorage for pending join (instant, reliable)
      const pendingJoin = getPendingJoin();
      const hasPendingLocal = pendingJoin && pendingJoin.address === address.toLowerCase();

      // Then check backend
      const result = await checkMember(address);
      
      if (result.isMember) {
        setIsJoined(true);
        
        if (result.member?.tx_hash) {
          // Fully finalized - has tx_hash
          setTxHash(result.member.tx_hash);
          setFinalized(true);
          setTxStatus('success');
          clearPendingJoin(); // Clear localStorage since finalized
        } else {
          // Pending - registered but no tx_hash yet
          setFinalized(false);
          setTxStatus('confirming');
          setLoading(true);
        }
      } else if (hasPendingLocal) {
        // Backend doesn't know yet, but we have localStorage pending state
        // This happens if backend call failed or was slow during join
        setIsJoined(true);
        setFinalized(false);
        setTxStatus('confirming');
        setLoading(true);
        // Try to register again in backend (in case it failed before)
        registerMember(address, '');
      }
    } catch {
      // Backend failed - check localStorage as fallback
      const pendingJoin = getPendingJoin();
      if (pendingJoin && pendingJoin.address === address.toLowerCase()) {
        setIsJoined(true);
        setFinalized(false);
        setTxStatus('confirming');
        setLoading(true);
      }
    } finally {
      setCheckingMembership(false);
    }
  }, [address, isConnected]);

  useEffect(() => {
    checkMembership();
  }, [checkMembership]);

  // Start watching when we detect pending state (after page reload)
  useEffect(() => {
    if (isJoined && !finalized && txStatus === 'confirming' && publicClient) {
      startWatchingFinalization();
    }
    return () => {
      unwatchRef.current?.();
      unwatchRef.current = null;
    };
  }, [isJoined, finalized, txStatus, publicClient, startWatchingFinalization]);

  const handleJoin = async () => {
    setError(null);
    setTxStatus('idle');

    if (!isConnected || !address) {
      setError('Please connect wallet first');
      return false;
    }
    if (!varaApi) {
      setError('API not ready yet, please wait...');
      return false;
    }
    if (!sails) {
      setError('Loading program interface...');
      return false;
    }

    setLoading(true);
    setTxHash(null);
    setFinalized(false);
    setTxStatus('signing');

    try {
      const payload = sails.services.OneOfUs.functions.JoinUs.encodePayload();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const injected = await varaApi.createInjectedTransaction({
        destination: ENV.PROGRAM_ID,
        payload: payload as `0x${string}`,
        value: 0n,
      } as any);

      // send() returns "Accept" or "Reject" immediately after signing
      const sendResult = await injected.send();

      if (sendResult === 'Reject') {
        throw new Error('Transaction rejected by validator');
      }

      // Accept = transaction guaranteed to be included
      // Update UI immediately (optimistic)
      setIsJoined(true);
      setTxStatus('confirming');
      setFinalized(false);

      // Save pending state to localStorage FIRST (instant, reliable)
      savePendingJoin(address);

      // Optimistically increment counter
      onOptimisticJoin?.();

      // Register in backend as pending (no tx_hash yet)
      // Don't await - localStorage is our reliable source now
      registerMember(address, '');

      // Start watching for finalization
      startWatchingFinalization();

      return true;
    } catch (e: any) {
      setTxStatus('error');

      if (e?.code === 4001 || e?.message?.includes('rejected') || e?.message?.includes('denied')) {
        setError('Transaction cancelled by user');
      } else if (e?.message?.includes('already')) {
        setError('You are already a member!');
        setIsJoined(true);
      } else if (e?.message?.includes('insufficient')) {
        setError('Insufficient funds for transaction');
      } else {
        setError('Something went wrong. Please try again.');
      }
      setLoading(false);
      return false;
    }
  };

  const clearError = () => {
    setError(null);
    setTxStatus('idle');
  };

  return {
    isJoined,
    loading,
    txHash,
    finalized,
    error,
    txStatus,
    checkingMembership,
    handleJoin,
    clearError,
  };
};
