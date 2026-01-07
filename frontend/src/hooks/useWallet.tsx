import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createPublicClient,
  createWalletClient,
  custom,
  defineChain,
  type PublicClient,
  type WalletClient,
  type EIP1193Provider,
} from 'viem';
import { HOODI_CHAIN_ID_HEX, HOODI_NETWORK_PARAMS, HOODI_CHAIN_ID, HOODI_RPC_URL, HOODI_EXPLORER_URL } from '../config/constants';

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
const DISCONNECTED_KEY = 'one-of-us-wallet-disconnected';

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

  const hoodiChain = useMemo(() => defineChain({
    id: HOODI_CHAIN_ID,
    name: 'Hoodi Testnet',
    nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
    rpcUrls: { default: { http: [HOODI_RPC_URL] } },
    blockExplorers: { default: { name: 'Etherscan', url: HOODI_EXPLORER_URL } },
    testnet: true,
  }), []);

  const buildClients = useCallback((eth: EIP1193Provider, account: `0x${string}`) => {
    const transport = custom(eth);
    const wc = createWalletClient({ account, chain: hoodiChain, transport });
    const pc = createPublicClient({ chain: hoodiChain, transport });
    return { wc, pc };
  }, [hoodiChain]);

  useEffect(() => {
    const eth = pickEthereumProvider();
    if (!eth) return;

    let mounted = true;

    const init = async () => {
      try {
        // Check if user manually disconnected
        const wasDisconnected = localStorage.getItem(DISCONNECTED_KEY) === 'true';
        if (wasDisconnected) {
          return;
        }

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

          const { wc, pc } = buildClients(eth, addr);
          setWalletClient(wc);
          setPublicClient(pc);
        }
      } catch (e: any) {
        if (!mounted) return;

        setError(e?.message || 'Provider error on eth_accounts. Возможно, window.ethereum не MetaMask.');
      }
    };

    init();

    const handleAccountsChanged = (accounts: string[]) => {
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

      const { wc, pc } = buildClients(eth, addr);
      setWalletClient(wc);
      setPublicClient(pc);
    };

    const handleChainChanged = async (newChainIdHex: string) => {
      const cid = newChainIdHex ? parseInt(newChainIdHex, 16) : null;
      if (!mounted) return;
      setChainId(cid);

      const accounts = (await eth.request({ method: 'eth_accounts' })) as string[];
      if (accounts.length > 0) {
        const addr = accounts[0] as `0x${string}`;
        const { wc, pc } = buildClients(eth, addr);
        setWalletClient(wc);
        setPublicClient(pc);
      }
    };

    const handleDisconnect = (_err: any) => {
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
      setError('MetaMask is not installed');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    if (connectInFlightRef.current) return;

    connectInFlightRef.current = true;
    setIsConnecting(true);
    setError(null);

    // Clear disconnect flag when user explicitly connects
    localStorage.removeItem(DISCONNECTED_KEY);

    try {
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

      const { wc, pc } = buildClients(eth, addr);
      setWalletClient(wc);
      setPublicClient(pc);
    } catch (err: any) {
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
    // Set flag so we don't auto-connect on page reload
    localStorage.setItem(DISCONNECTED_KEY, 'true');
    
    setAddress(null);
    setIsConnected(false);
    setError(null);
    setWalletClient(null);
    setPublicClient(null);
  }, []);

  const switchToHoodi = useCallback(async () => {
    const eth = pickEthereumProvider();
    if (!eth) {
      setError('No wallet detected');
      return;
    }

    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: HOODI_CHAIN_ID_HEX }],
      });
    } catch (switchError: any) {
      if (switchError?.code === 4902) {
        try {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [HOODI_NETWORK_PARAMS],
          });
        } catch {
          setError('Failed to add Hoodi network');
        }
      } else {
        setError('Failed to switch network');
      }
    }
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
    switchToHoodi,
    walletClient,
    publicClient,
  };
}
