import { useState, useCallback } from 'react';
import { WsVaraEthProvider, createVaraEthApi } from '@vara-eth/api';
import { walletClientToSigner } from '@vara-eth/api/signer';
import { createPublicClient, createWalletClient, http, defineChain } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { Sails } from 'sails-js';
import { ENV } from '../config/env';

export type TestSendStatus = 'idle' | 'sending' | 'success' | 'error';

/**
 * Walletless test-mode sender (testnet only).
 *
 * Each send generates a fresh ephemeral key in-browser, signs an injected
 * JoinUs message with it and submits it directly to the Vara.eth validator —
 * no MetaMask, no ETH needed (the program pays execution from its executable
 * balance). A new key every time means JoinUs always succeeds and the on-chain
 * counter keeps growing.
 */
export const useTestSend = (sails: Sails | null, onSent?: () => void) => {
  const [status, setStatus] = useState<TestSendStatus>('idle');
  const [lastAddress, setLastAddress] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sentCount, setSentCount] = useState(0);

  const send = useCallback(async () => {
    if (status === 'sending') return;
    if (!sails) {
      setError('Loading program interface...');
      setStatus('error');
      return;
    }

    setStatus('sending');
    setError(null);
    setLastResult(null);

    let provider: WsVaraEthProvider | null = null;
    try {
      // Fresh throwaway key per send.
      const account = privateKeyToAccount(generatePrivateKey());
      setLastAddress(account.address);

      const chain = defineChain({
        id: ENV.CHAIN_ID,
        name: ENV.CHAIN_NAME,
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: [ENV.ETH_RPC] } },
      });
      const publicClient = createPublicClient({ chain, transport: http(ENV.ETH_RPC) });
      const walletClient = createWalletClient({ account, chain, transport: http(ENV.ETH_RPC) });
      const signer = walletClientToSigner(walletClient);

      provider = new WsVaraEthProvider(ENV.VARA_ETH_WS as `ws://${string}` | `wss://${string}`);
      await provider.connect();

      const api = await createVaraEthApi(provider, publicClient, ENV.ROUTER_ADDRESS, signer);

      const payload = sails.services.OneOfUs.functions.JoinUs.encodePayload();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const injected = await api.createInjectedTransaction({
        destination: ENV.PROGRAM_ID,
        payload: payload as `0x${string}`,
        value: 0n,
      } as any);

      await injected.setReferenceBlock();
      await injected.sign();

      const receipt = await injected.sendAndWaitForReceipt();
      if (receipt.error !== null) {
        throw new Error('Transaction purged: ' + receipt.error);
      }

      const { payload: replyPayload, code } = receipt.promise;
      if (code.isError) {
        throw new Error('Execution error: ' + code.reason);
      }

      const joined = sails.services.OneOfUs.functions.JoinUs.decodeResult(
        replyPayload as `0x${string}`,
      );
      setLastResult(`message ${injected.messageId.slice(0, 10)}… → joined=${joined}`);
      setSentCount((n) => n + 1);
      setStatus('success');
      onSent?.();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Send failed';
      setError(msg);
      setStatus('error');
    } finally {
      provider?.disconnect?.();
    }
  }, [sails, status, onSent]);

  return { send, status, lastAddress, lastResult, error, sentCount };
};
