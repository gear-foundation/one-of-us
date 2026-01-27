import { useEffect, useState, useCallback, useRef } from 'react';
import { VaraEthApi } from '@vara-eth/api';
import { Sails } from 'sails-js';
import { ENV } from '../config/env';
import { MEMBER_COUNT_REFRESH_MS, ZERO_ADDRESS } from '../config/constants';
import { useReadOnlyApi } from './useReadOnlyApi';

const PENDING_JOIN_KEY = 'one-of-us-pending-join';
const COUNT_PAUSE_AFTER_JOIN_MS = 30000;

function getInitialCountFromPendingJoin(): { count: number; pauseUntil: number } | null {
  try {
    const data = localStorage.getItem(PENDING_JOIN_KEY);
    if (!data) return null;
    
    const pending = JSON.parse(data);
    const pauseUntil = pending.timestamp + COUNT_PAUSE_AFTER_JOIN_MS;
    
    if (Date.now() < pauseUntil) {
      return { count: pending.memberCountAtJoin, pauseUntil };
    }
    return null;
  } catch {
    return null;
  }
}

export const useMemberCount = (sails: Sails | null, walletApi?: VaraEthApi | null) => {
  const initial = getInitialCountFromPendingJoin();
  const [memberCount, setMemberCount] = useState(initial?.count ?? 0);
  const [isLoading, setIsLoading] = useState(!initial);
  const pausedUntilRef = useRef<number>(initial?.pauseUntil ?? 0);

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
    pausedUntilRef.current = Date.now() + COUNT_PAUSE_AFTER_JOIN_MS;
  }, []);

  return { memberCount, isLoading, setMemberCount: setCount };
};
