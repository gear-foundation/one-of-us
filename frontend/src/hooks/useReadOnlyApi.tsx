import { useEffect, useState } from 'react';
import {
  HttpVaraEthProvider,
  WsVaraEthProvider,
  createVaraEthApi,
} from '@vara-eth/api';
import type { VaraEthApi } from '@vara-eth/api';
import { createPublicClient, defineChain, http } from 'viem';
import { ENV } from '../config/env';
import { TARGET_CHAIN_ID, TARGET_NETWORK_NAME, TARGET_RPC_URL } from '../config/constants';

export const useReadOnlyApi = () => {
  const [api, setApi] = useState<VaraEthApi | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!ENV.VARA_ETH_HTTP && !ENV.VARA_ETH_WS) return;

    let mounted = true;
    let currentApi: VaraEthApi | null = null;

    const init = async () => {
      try {
        const chain = defineChain({
          id: TARGET_CHAIN_ID,
          name: TARGET_NETWORK_NAME,
          nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
          rpcUrls: { default: { http: [TARGET_RPC_URL] } },
        });
        const publicClient = createPublicClient({
          chain,
          transport: http(TARGET_RPC_URL),
        });

        const provider = ENV.VARA_ETH_WS
          ? new WsVaraEthProvider(ENV.VARA_ETH_WS as `ws://${string}` | `wss://${string}`)
          : new HttpVaraEthProvider(ENV.VARA_ETH_HTTP as `http://${string}` | `https://${string}`);

        if (provider instanceof WsVaraEthProvider) {
          await provider.connect();
        }

        currentApi = await createVaraEthApi(
          provider,
          publicClient,
          ENV.ROUTER_ADDRESS
        );

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
