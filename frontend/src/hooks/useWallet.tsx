import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createPublicClient,
  createWalletClient,
  custom,
  type PublicClient,
  type WalletClient,
  type EIP1193Provider,
} from 'viem';

declare global {
  interface Window {
    ethereum?: EIP1193Provider & {
      isMetaMask?: boolean;
      providers?: EIP1193Provider[]; // multi-injected wallets
      on?: (event: string, handler: (...args: any[]) => void) => void;
      removeListener?: (event: string, handler: (...args: any[]) => void) => void;
    };
  }
}

/**
 * Выбираем правильный провайдер.
 * Если есть несколько (window.ethereum.providers),
 * берём MetaMask по флагу isMetaMask.
 */
function pickEthereumProvider(): (EIP1193Provider & any) | null {
  const eth = window.ethereum;
  if (!eth) return null;

  const providers = (eth as any).providers as any[] | undefined;
  if (providers && providers.length > 0) {
    const mm = providers.find((p) => p?.isMetaMask);
    if (mm) return mm;
    // если MetaMask нет, вернём первый чтобы хотя бы не падать
    return providers[0];
  }

  return eth as any;
}

export function useWallet() {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [publicClient, setPublicClient] = useState<PublicClient | null>(null);

  const connectInFlightRef = useRef(false);

  const isMetaMaskInstalled = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const eth = pickEthereumProvider();
    return !!eth?.isMetaMask;
  }, []);

  const buildClients = useCallback((eth: EIP1193Provider) => {
    const transport = custom(eth);
    const wc = createWalletClient({ transport });
    const pc = createPublicClient({ transport });
    return { wc, pc };
  }, []);

  useEffect(() => {
    const eth = pickEthereumProvider();
    if (!eth) {
      console.log('[wallet] No EIP-1193 provider detected');
      return;
    }

    let mounted = true;

    const init = async () => {
      try {
        console.log('[wallet] checking existing accounts...');
        const accounts = (await eth.request({
          method: 'eth_accounts',
        })) as string[];

        const cidHex = (await eth.request({
          method: 'eth_chainId',
        })) as string;
        const cid = cidHex ? parseInt(cidHex, 16) : null;

        if (!mounted) return;

        setChainId(cid);

        if (accounts.length > 0) {
          const addr = accounts[0] as `0x${string}`;
          setAddress(addr);
          setIsConnected(true);
          setError(null);

          const { wc, pc } = buildClients(eth);
          setWalletClient(wc);
          setPublicClient(pc);

          console.log('[wallet] already connected:', addr, 'chainId:', cid);
        } else {
          console.log('[wallet] no connected accounts yet');
        }
      } catch (e: any) {
        console.error('[wallet] init error:', e);
        if (!mounted) return;

        setError(e?.message || 'Provider error on eth_accounts. Возможно, window.ethereum не MetaMask.');
      }
    };

    init();

    const handleAccountsChanged = (accounts: string[]) => {
      console.log('[wallet] accountsChanged:', accounts);
      if (!mounted) return;

      if (!accounts || accounts.length === 0) {
        setAddress(null);
        setIsConnected(false);
        setError(null);
        setWalletClient(null);
        setPublicClient(null);
        return;
      }

      const addr = accounts[0] as `0x${string}`;
      setAddress(addr);
      setIsConnected(true);
      setError(null);

      const { wc, pc } = buildClients(eth);
      setWalletClient(wc);
      setPublicClient(pc);
    };

    const handleChainChanged = (newChainIdHex: string) => {
      const cid = newChainIdHex ? parseInt(newChainIdHex, 16) : null;
      console.log('[wallet] chainChanged:', cid);

      if (!mounted) return;
      setChainId(cid);

      const { wc, pc } = buildClients(eth);
      setWalletClient(wc);
      setPublicClient(pc);
    };

    const handleDisconnect = (err: any) => {
      console.log('[wallet] disconnect:', err);
      if (!mounted) return;

      setAddress(null);
      setChainId(null);
      setIsConnected(false);
      setError(null);
      setWalletClient(null);
      setPublicClient(null);
    };

    (eth as any).on?.('accountsChanged', handleAccountsChanged);
    (eth as any).on?.('chainChanged', handleChainChanged);
    (eth as any).on?.('disconnect', handleDisconnect);

    return () => {
      mounted = false;
      (eth as any).removeListener?.('accountsChanged', handleAccountsChanged);
      (eth as any).removeListener?.('chainChanged', handleChainChanged);
      (eth as any).removeListener?.('disconnect', handleDisconnect);
    };
  }, [buildClients]);

  const connect = useCallback(async () => {
    const eth = pickEthereumProvider();
    if (!eth) {
      const msg = 'MetaMask is not installed (or not detected).';
      setError(msg);
      console.error('[wallet]', msg);
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    if (!eth.isMetaMask) {
      console.warn('[wallet] picked provider is not MetaMask:', eth);
      // не блокируем, но предупреждаем
    }

    if (connectInFlightRef.current) {
      console.log('[wallet] connect already in progress, ignoring');
      return;
    }

    connectInFlightRef.current = true;
    setIsConnecting(true);
    setError(null);

    try {
      console.log('[wallet] requesting accounts...');
      const accounts = (await eth.request({
        method: 'eth_requestAccounts',
      })) as string[];

      const cidHex = (await eth.request({
        method: 'eth_chainId',
      })) as string;
      const cid = cidHex ? parseInt(cidHex, 16) : null;

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from provider');
      }

      const addr = accounts[0] as `0x${string}`;

      setAddress(addr);
      setChainId(cid);
      setIsConnected(true);

      const { wc, pc } = buildClients(eth);
      setWalletClient(wc);
      setPublicClient(pc);

      console.log('[wallet] connected:', addr, 'chainId:', cid);
    } catch (err: any) {
      console.error('[wallet] connect error:', err);

      if (err?.code === 4001) {
        setError('Connection rejected by user');
      } else if (err?.code === -32002) {
        setError('Connection request already pending. Please check wallet popup.');
      } else {
        setError(err?.message || 'Failed to connect to provider');
      }

      setIsConnected(false);
      setAddress(null);
      setWalletClient(null);
      setPublicClient(null);
    } finally {
      setIsConnecting(false);
      connectInFlightRef.current = false;
    }
  }, [buildClients]);

  const disconnect = useCallback(() => {
    console.log('[wallet] local disconnect');
    setAddress(null);
    setIsConnected(false);
    setError(null);
    setWalletClient(null);
    setPublicClient(null);
  }, []);

  return {
    address,
    chainId,
    isConnected,
    isConnecting,
    error,
    isMetaMaskInstalled,
    connect,
    disconnect,
    walletClient,
    publicClient,
  };
}
