import { useEffect, useState } from 'react';
import { VaraEthApi, HttpVaraEthProvider, WsVaraEthProvider } from '@vara-eth/api';
import { ENV } from '../config/env';

export const useReadOnlyApi = () => {
  const [api, setApi] = useState<VaraEthApi | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!ENV.VARA_ETH_HTTP && !ENV.VARA_ETH_WS) return;

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

        currentApi = new VaraEthApi(provider, null as any);

        if (mounted) {
          setApi(currentApi);
          setIsReady(true);
        }
      } catch {
        // ignore
      }
    };

    init();

    return () => {
      mounted = false;
      currentApi?.provider.disconnect?.();
    };
  }, []);

  return { api, isReady };
};
