import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
  type PublicClient,
  type WalletClient,
} from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { HOODI_CHAIN_ID, HOODI_RPC_URL, HOODI_EXPLORER_URL } from '../config/constants';

const hoodiChain = defineChain({
  id: HOODI_CHAIN_ID,
  name: 'Hoodi Testnet',
  nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
  rpcUrls: { default: { http: [HOODI_RPC_URL] } },
  blockExplorers: { default: { name: 'Etherscan', url: HOODI_EXPLORER_URL } },
  testnet: true,
});

const transport = http(HOODI_RPC_URL);

function buildClients(account: ReturnType<typeof privateKeyToAccount>) {
  const wc = createWalletClient({
    account,
    chain: hoodiChain,
    transport,
  });
  const pc = createPublicClient({
    chain: hoodiChain,
    transport,
  });
  return { wc, pc };
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
  const accountRef = useRef<ReturnType<typeof privateKeyToAccount> | null>(null);

  const connect = useCallback(async () => {
    if (connectInFlightRef.current) return;

    connectInFlightRef.current = true;
    setIsConnecting(true);
    setError(null);

    try {
      const privateKey = generatePrivateKey();
      const account = privateKeyToAccount(privateKey);
      accountRef.current = account;

      const { wc, pc } = buildClients(account);

      const cid = await pc.getChainId();

      setAddress(account.address);
      setChainId(cid);
      setIsConnected(true);
      setWalletClient(wc);
      setPublicClient(pc);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate wallet';
      setError(message);
      setIsConnected(false);
      setAddress(null);
      setWalletClient(null);
      setPublicClient(null);
      accountRef.current = null;
    } finally {
      setIsConnecting(false);
      connectInFlightRef.current = false;
    }
  }, []);

  const disconnect = useCallback(() => {
    accountRef.current = null;
    setAddress(null);
    setChainId(null);
    setIsConnected(false);
    setError(null);
    setWalletClient(null);
    setPublicClient(null);
  }, []);

  // При монтировании генерируем ключи и создаём клиентов (для EthereumClient / publicClient)
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const privateKey = generatePrivateKey();
        const account = privateKeyToAccount(privateKey);
        accountRef.current = account;

        const { wc, pc } = buildClients(account);
        const cid = await pc.getChainId();

        if (!mounted) return;

        setAddress(account.address);
        setChainId(cid);
        setIsConnected(true);
        setWalletClient(wc);
        setPublicClient(pc);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Failed to init wallet');
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    address,
    chainId,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    walletClient,
    publicClient,
  };
}
