import { useState } from 'react';
import { VaraEthApi, InjectedTransaction } from '@vara-eth/api';
import { Sails } from 'sails-js';
import { ENV } from '../config/env';

/**
 * Hook to handle joining the program
 */
export const useJoinProgram = (
  varaApi: VaraEthApi | null,
  sails: Sails | null,
  address: string | null,
  isConnected: boolean
) => {
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preConfirmed, setPreConfirmed] = useState<string | null>(null);
  const [finalized, setFinalized] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!isConnected || !address) {
      alert('Please connect MetaMask first!');
      return;
    }
    if (!varaApi) {
      alert('Vara.Eth API not ready yet');
      return;
    }
    if (!sails) {
      alert('Sails not ready yet');
      return;
    }

    setLoading(true);
    setPreConfirmed(null);
    setFinalized(null);

    try {
      const payload = sails.services.OneOfUs.functions.JoinUs.encodePayload();

      const injected = await varaApi.createInjectedTransaction(
        new InjectedTransaction({
          destination: ENV.PROGRAM_ID,
          payload,
          value: 0n,
        })
      );

      const promise = await injected.sendAndWaitForPromise();

      const txHash = (promise as any).txHash || (promise as any).hash || (promise as any).transactionHash;

      if (txHash) setPreConfirmed(txHash);
      setFinalized('ok');
      setIsJoined(true);

      alert('Done! 🎉 You are now ONE OF US!');

      return true;
    } catch (e: any) {
      console.error('Failed to join:', e);
      alert(`Failed to join: ${e.message || 'Please try again'}`);
      setIsJoined(false);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    isJoined,
    loading,
    preConfirmed,
    finalized,
    handleJoin,
  };
};
