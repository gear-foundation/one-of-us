import { useEffect, useState } from 'react';
import { VaraEthApi } from '@vara-eth/api';
import { Sails } from 'sails-js';
import { ENV } from '../config/env';
import { MEMBER_COUNT_REFRESH_MS } from '../config/constants';

/**
 * Hook to fetch and manage member count
 */
export const useMemberCount = (varaApi: VaraEthApi | null, sails: Sails | null, address: string | null) => {
  const [memberCount, setMemberCount] = useState(0);

  const fetchCount = async () => {
    if (!varaApi || !sails || !address) return;

    try {
      const countPayload = sails.services.OneOfUs.queries.Count.encodePayload();
      const countReply = await varaApi.call.program.calculateReplyForHandle(
        address as `0x${string}`,
        ENV.PROGRAM_ID,
        countPayload
      );
      const count = sails.services.OneOfUs.queries.Count.decodeResult(countReply.payload);
      setMemberCount(Number(count));
    } catch (err) {
      console.error('Failed to fetch count:', err);
    }
  };

  useEffect(() => {
    if (!varaApi || !sails || !address) return;

    fetchCount();
    const interval = setInterval(fetchCount, MEMBER_COUNT_REFRESH_MS);
    return () => clearInterval(interval);
  }, [varaApi, sails, address]);

  return { memberCount, refetchCount: fetchCount };
};
