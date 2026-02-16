import { useState, useEffect, useCallback, useRef } from 'react';
import { VaraEthApi } from '@vara-eth/api';
import { Sails } from 'sails-js';
import  { compactAddLength} from '@polkadot/util'
import { type PublicClient, hexToBytes, concat, sha256, stringToHex } from 'viem';
import { ENV } from '../config/env';
import { registerMember, checkMember, updateMemberTxHash } from '../utils/api';
import { openPasskeyPopupAndWait } from '../features/auth/passkeyPopup';
import { VARAUTH_PROGRAM_ID } from '../features/auth/consts';
import { useSails } from './useSails';
import idlContentAuth from '../features/auth/varauth.idl?raw';

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
  _isConnected: boolean,
  publicClient: PublicClient | null,
  currentMemberCount: number,
  onMemberCountRestore?: (count: number) => void
) => {
  const isConnected = true;
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [finalized, setFinalized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [checkingMembership, setCheckingMembership] = useState(false);
  const unwatchRef = useRef<(() => void) | null>(null);
  const addressRef = useRef<string | null>(null);

  const { sails: sailsAuth } = useSails(idlContentAuth);

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
    if (!sailsAuth) {
      setError('Loading auth program interface...');
      return false;
    }

    setLoading(true);
    setTxHash(null);
    setFinalized(false);
    setTxStatus('signing');

    try {
        // const d32bytes = '0x' + '0xcb72581cbec72ece141fec7422e83b68f9e551df'.slice(2).padStart(64, '0');
      // const isOneOfUsPayload = sails.services.OneOfUs.queries.IsOneOfUs.encodePayload(d32bytes);
      // console.log("🚀 ~ handleJoin ~ isOneOfUs:", isOneOfUsPayload)
      // const isOneOfUsReply = await varaApi.call.program.calculateReplyForHandle(address, '0xf3692291b8da827d3a39f6072720a79422401991', isOneOfUsPayload);
      // console.log("🚀 ~ handleJoin ~ isOneOfUsReply:", isOneOfUsReply)
      // const isOneOfUs = sails.services.OneOfUs.queries.IsOneOfUs.decodeResult(isOneOfUsReply.payload);
      // console.log("🚀 ~ handleJoin ~ isOneOfUs:", isOneOfUs)
      // return;
      const nonceTx =
        sailsAuth.services.Nonce.queries.NextNonce.encodePayload();
      const nonceReply = await varaApi.call.program.calculateReplyForHandle(
        address,
        VARAUTH_PROGRAM_ID,
        nonceTx
      );
      const nonce = sailsAuth.services.Nonce.queries.NextNonce.decodeResult(
        nonceReply.payload
      );
      console.log("🚀 ~ handleJoin ~ nonce:", nonce)

      const joinPayload =
        sails.services.OneOfUs.functions.JoinUs.encodePayload();
      const destinationId = ENV.PROGRAM_ID;
      // const dataToSign = {
      //   payload: joinPayload,
      //   nonce,
      //   destinationId,
      // };

      // Encode (payload, nonce, destination) per Scale-like layout and hash
      const payloadBytes = hexToBytes(joinPayload);
      console.log("🚀 ~ handleJoin ~ payloadBytes:", payloadBytes)
     
      const nonceBytes = new Uint8Array(8);
      new DataView(nonceBytes.buffer).setBigUint64(0, BigInt(nonce), true);
      console.log("🚀 ~ handleJoin ~ nonceBytes:", nonceBytes)
      
      const destinationBytes = hexToBytes(
        ("0x" + destinationId.slice(2).padStart(64, "0")) as `0x${string}`
      );
      console.log("🚀 ~ handleJoin ~ destinationBytes:", destinationBytes)

      const encodedForSign = concat([
        compactAddLength(payloadBytes),
        nonceBytes,
        destinationBytes,
      ]);
      console.log("🚀 ~ handleJoin ~ encodedForSign:", encodedForSign)
      const hashToSign = sha256(encodedForSign);
      console.log("🚀 ~ handleJoin ~ hashToSign:", hashToSign)

      const result = await openPasskeyPopupAndWait(hashToSign);
      const { signature, credential_id, authenticator_data, id } = result;
      console.log("Passkey result:", result);

      const destination32bytes =
        "0x" + destinationId.slice(2).padStart(64, "0");
      const payloaToProxy =
        sailsAuth.services.Verifier.functions.SubmitTx.encodePayload(
          joinPayload,
          nonce,
          destination32bytes,
          'https://passkey.mithriy.com',
          authenticator_data,
          signature
        );
      console.log("🚀 ~ handleJoin ~ payloaToProxy:", payloaToProxy);

      const injected = await varaApi.createInjectedTransaction({
        destination: VARAUTH_PROGRAM_ID,
        payload: payloaToProxy,
        value: 0n,
      });
      console.log("🚀 ~ handleJoin ~ injected:", injected);
      const sendResult = await injected.sendAndWaitForPromise();
      console.log("🚀 ~ handleJoin ~ sendResult:", sendResult);

      // if (sendResult === 'Reject') {
      //   throw new Error('Transaction rejected by validator');
      // }

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
      console.error('Error:', e);

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
