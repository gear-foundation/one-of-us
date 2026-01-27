import { useState, useEffect, useCallback, useRef } from 'react';
import { VaraEthApi } from '@vara-eth/api';
import { Sails } from 'sails-js';
import { type PublicClient } from 'viem';
import { ENV } from '../config/env';
import { registerMember, checkMember, updateMemberTxHash } from '../utils/api';

const STATE_CHANGED_EVENT = {
  type: 'event',
  name: 'StateChanged',
  inputs: [{ name: 'stateHash', type: 'bytes32', indexed: false }],
} as const;

const PENDING_JOIN_KEY = 'one-of-us-pending-join';
const PENDING_JOIN_TIMEOUT = 10 * 60 * 1000; // 10 minutes

interface PendingJoin {
  address: string;
  timestamp: number;
  memberCountAtJoin: number;
}

function savePendingJoin(address: string, memberCount: number) {
  const pending: PendingJoin = {
    address: address.toLowerCase(),
    timestamp: Date.now(),
    memberCountAtJoin: memberCount,
  };
  localStorage.setItem(PENDING_JOIN_KEY, JSON.stringify(pending));
}

function getPendingJoin(): PendingJoin | null {
  try {
    const data = localStorage.getItem(PENDING_JOIN_KEY);
    if (!data) return null;
    
    const pending: PendingJoin = JSON.parse(data);
    if (Date.now() - pending.timestamp > PENDING_JOIN_TIMEOUT) {
      localStorage.removeItem(PENDING_JOIN_KEY);
      return null;
    }
    return pending;
  } catch {
    return null;
  }
}

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
  currentMemberCount: number,
  onMemberCountRestore?: (count: number) => void
) => {
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [finalized, setFinalized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [checkingMembership, setCheckingMembership] = useState(false);
  const unwatchRef = useRef<(() => void) | null>(null);
  const addressRef = useRef<string | null>(null);

  useEffect(() => {
    addressRef.current = address;
  }, [address]);

  const startWatchingFinalization = useCallback(() => {
    if (!publicClient || !address || unwatchRef.current) return;

    const watchAddress = address;
    unwatchRef.current = publicClient.watchContractEvent({
      address: ENV.PROGRAM_ID,
      abi: [STATE_CHANGED_EVENT],
      eventName: 'StateChanged',
      onLogs: (logs) => {
        if (addressRef.current !== watchAddress) {
          unwatchRef.current?.();
          unwatchRef.current = null;
          return;
        }
        
        if (logs.length > 0) {
          const hash = logs[0].transactionHash;
          setTxHash(hash);
          setFinalized(true);
          setTxStatus('success');
          setLoading(false);
          clearPendingJoin();
          unwatchRef.current?.();
          unwatchRef.current = null;
          if (addressRef.current) {
            updateMemberTxHash(addressRef.current, hash);
          }
        }
      },
    });

    setTimeout(() => {
      if (unwatchRef.current && addressRef.current === watchAddress) {
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
    unwatchRef.current?.();
    unwatchRef.current = null;
    
    setIsJoined(false);
    setLoading(false);
    setTxHash(null);
    setFinalized(false);
    setError(null);
    setTxStatus('idle');
    
    if (!address || !isConnected) {
      return;
    }

    setCheckingMembership(true);
    
    const pendingJoin = getPendingJoin();
    const hasPendingLocal = pendingJoin && pendingJoin.address === address.toLowerCase();
    
    if (pendingJoin && !hasPendingLocal) {
      clearPendingJoin();
    }

    try {
      const result = await checkMember(address);
      
      if (addressRef.current !== address) return;
      
      if (result.isMember) {
        setIsJoined(true);
        
        if (result.member?.tx_hash) {
          setTxHash(result.member.tx_hash);
          setFinalized(true);
          setTxStatus('success');
          clearPendingJoin();
        } else {
          setFinalized(false);
          setTxStatus('confirming');
          setLoading(true);
          
          if (hasPendingLocal) {
            onMemberCountRestore?.(pendingJoin.memberCountAtJoin);
          }
        }
      } else if (hasPendingLocal) {
        setIsJoined(true);
        setFinalized(false);
        setTxStatus('confirming');
        setLoading(true);
        onMemberCountRestore?.(pendingJoin.memberCountAtJoin);
        registerMember(address, '');
      }
    } catch {
      if (addressRef.current !== address) return;
      
      if (hasPendingLocal) {
        setIsJoined(true);
        setFinalized(false);
        setTxStatus('confirming');
        setLoading(true);
        onMemberCountRestore?.(pendingJoin.memberCountAtJoin);
      }
    } finally {
      setCheckingMembership(false);
    }
  }, [address, isConnected, onMemberCountRestore]);

  useEffect(() => {
    checkMembership();
  }, [checkMembership]);

  useEffect(() => {
    if (isJoined && !finalized && txStatus === 'confirming' && publicClient && address) {
      startWatchingFinalization();
    }
    return () => {
      unwatchRef.current?.();
      unwatchRef.current = null;
    };
  }, [isJoined, finalized, txStatus, publicClient, startWatchingFinalization, address]);

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

      const sendResult = await injected.send();

      if (sendResult === 'Reject') {
        throw new Error('Transaction rejected by validator');
      }

      setIsJoined(true);
      setTxStatus('confirming');
      setFinalized(false);

      const newCount = currentMemberCount + 1;
      savePendingJoin(address, newCount);
      onMemberCountRestore?.(newCount);
      
      registerMember(address, '');
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
