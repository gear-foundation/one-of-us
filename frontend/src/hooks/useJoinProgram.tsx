import { useState, useEffect, useCallback } from 'react';
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

  const checkMembership = useCallback(async () => {
    if (!address || !isConnected) return;

    setCheckingMembership(true);
    try {
      const result = await checkMember(address);
      if (result.isMember) {
        setIsJoined(true);
        setFinalized(true);
        if (result.member?.tx_hash) {
          setTxHash(result.member.tx_hash);
        }
      }
    } catch {
      // ignore
    } finally {
      setCheckingMembership(false);
    }
  }, [address, isConnected]);

  useEffect(() => {
    checkMembership();
  }, [checkMembership]);

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

      // Optimistically increment counter
      onOptimisticJoin?.();

      // Register in backend
      if (address) {
        registerMember(address, '');
      }

      // Watch for StateChanged event on Mirror contract (program address)
      if (publicClient && address) {
        const userAddress = address;
        const unwatch = publicClient.watchContractEvent({
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
              unwatch();
              updateMemberTxHash(userAddress, hash);
            }
          },
        });

        // Cleanup after 5 minutes max
        setTimeout(() => {
          unwatch();
          if (!finalized) {
            setFinalized(true);
            setTxStatus('success');
          }
        }, 300000);
      } else {
        // No publicClient, just mark as success
        setFinalized(true);
        setTxStatus('success');
      }

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
      return false;
    } finally {
      setLoading(false);
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
