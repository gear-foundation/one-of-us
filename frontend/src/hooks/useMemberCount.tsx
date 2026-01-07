import { useEffect, useState, useCallback, useRef } from 'react';
import { VaraEthApi } from '@vara-eth/api';
import { Sails } from 'sails-js';
import { ENV } from '../config/env';
import { MEMBER_COUNT_REFRESH_MS, ZERO_ADDRESS } from '../config/constants';
import { useReadOnlyApi } from './useReadOnlyApi';

export const useMemberCount = (sails: Sails | null, walletApi?: VaraEthApi | null) => {
  const [memberCount, setMemberCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const pausedUntilRef = useRef<number>(0);

  const { api: readOnlyApi, isReady: readOnlyReady } = useReadOnlyApi();

  const api = walletApi || readOnlyApi;
  const isReady = walletApi ? true : readOnlyReady;

  const fetchCount = useCallback(async () => {
    if (!api || !sails || Date.now() < pausedUntilRef.current) return;

    try {
      const countPayload = sails.services.OneOfUs.queries.Count.encodePayload();
      const countReply = await api.call.program.calculateReplyForHandle(ZERO_ADDRESS, ENV.PROGRAM_ID, countPayload);
      const count = sails.services.OneOfUs.queries.Count.decodeResult(countReply.payload);
      setMemberCount(Number(count));
      setIsLoading(false);
    } catch {
      setIsLoading(false);
    }
  }, [api, sails]);

  useEffect(() => {
    if (!api || !sails || !isReady) return;

    fetchCount();
    const interval = setInterval(fetchCount, MEMBER_COUNT_REFRESH_MS);
    return () => clearInterval(interval);
  }, [api, sails, isReady, fetchCount]);

  const setCount = useCallback((count: number) => {
    setMemberCount(count);
    pausedUntilRef.current = Date.now() + 60000;
  }, []);

  return { memberCount, isLoading, setMemberCount: setCount };
};
