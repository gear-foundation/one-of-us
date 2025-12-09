import { useEffect, useState } from 'react';
import { VaraEthApi, HttpVaraEthProvider, WsVaraEthProvider, EthereumClient } from '@vara-eth/api';
import { ENV } from '../config/env';

/**
 * Hook to manage VaraEthApi instance
 */
export const useVaraApi = (ethereumClient: EthereumClient | null, isConnected: boolean) => {
  const [varaApi, setVaraApi] = useState<VaraEthApi | null>(null);

  useEffect(() => {
    if (!ethereumClient || !isConnected) {
      setVaraApi(null);
      return;
    }

    if (!ENV.VARA_ETH_HTTP && !ENV.VARA_ETH_WS) {
      setVaraApi(null);
      return;
    }

    const provider = ENV.VARA_ETH_WS
      ? new WsVaraEthProvider(ENV.VARA_ETH_WS)
      : new HttpVaraEthProvider(ENV.VARA_ETH_HTTP);

    const api = new VaraEthApi(provider, ethereumClient, ENV.ROUTER_ADDRESS);
    setVaraApi(api);

    return () => {
      api.provider.disconnect?.();
    };
  }, [ethereumClient, isConnected]);

  return varaApi;
};
