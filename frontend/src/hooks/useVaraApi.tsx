import { useEffect, useState } from 'react';
import {
  WsVaraEthProvider,
  EthereumClient,
  createVaraEthApi,
} from '@vara-eth/api';
import type { VaraEthApi } from '@vara-eth/api';
import { ENV } from '../config/env';

export const useVaraApi = (ethereumClient: EthereumClient | null, isConnected: boolean) => {
  const [varaApi, setVaraApi] = useState<VaraEthApi | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!ethereumClient || !isConnected) {
      setVaraApi(null);
      setIsReady(false);
      return;
    }

    let mounted = true;
    let currentApi: VaraEthApi | null = null;
    let provider: WsVaraEthProvider | null = null;

    const init = async () => {
      try {
        provider = new WsVaraEthProvider(ENV.VARA_ETH_WS);
        await provider.connect();
        console.log(`[useVaraApi] connected to ${ENV.VARA_ETH_WS}`);

        currentApi = await createVaraEthApi(
          provider,
          ethereumClient.publicClient,
          ENV.ROUTER_ADDRESS,
          ethereumClient.signer
        );

        if (mounted) {
          setVaraApi(currentApi);
          setIsReady(true);
        }
      } catch (e) {
        console.error('[useVaraApi] init failed:', e);
        if (mounted) {
          setIsReady(false);
        }
      }
    };

    init();

    return () => {
      mounted = false;
      provider?.disconnect?.();
    };
  }, [ethereumClient, isConnected]);

  return { varaApi, isReady };
};
