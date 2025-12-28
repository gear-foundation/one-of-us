import { useEffect, useState } from 'react';
import { VaraEthApi, HttpVaraEthProvider, WsVaraEthProvider, EthereumClient } from '@vara-eth/api';
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

    if (!ENV.VARA_ETH_HTTP && !ENV.VARA_ETH_WS) {
      setVaraApi(null);
      setIsReady(false);
      return;
    }

    let mounted = true;
    let currentApi: VaraEthApi | null = null;

    const init = async () => {
      try {
        const provider = ENV.VARA_ETH_WS
          ? new WsVaraEthProvider(ENV.VARA_ETH_WS as `ws://${string}` | `wss://${string}`)
          : new HttpVaraEthProvider(ENV.VARA_ETH_HTTP as `http://${string}` | `https://${string}`);

        if (provider instanceof WsVaraEthProvider) {
          await provider.connect();
        }

        currentApi = new VaraEthApi(provider, ethereumClient);

        if (mounted) {
          setVaraApi(currentApi);
          setIsReady(true);
        }
      } catch {
        if (mounted) {
          setIsReady(false);
        }
      }
    };

    init();

    return () => {
      mounted = false;
      currentApi?.provider.disconnect?.();
    };
  }, [ethereumClient, isConnected]);

  return { varaApi, isReady };
};
