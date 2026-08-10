import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

import { countPendingEvents } from '@/db/localMatches';
import { syncNow, type SyncOutcome } from '@/sync/sync';

export function useSync() {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const refreshPending = useCallback(async () => {
    setPending(await countPendingEvents());
  }, []);

  useEffect(() => {
    refreshPending();
  }, [refreshPending]);

  const sync = useCallback(async (): Promise<SyncOutcome> => {
    setSyncing(true);
    try {
      const outcome = await syncNow();
      setLastError(outcome.error ?? null);
      await refreshPending();
      if (outcome.ran) {
        await queryClient.invalidateQueries({ queryKey: ['matches'] });
      }
      return outcome;
    } finally {
      setSyncing(false);
    }
  }, [queryClient, refreshPending]);

  return { pending, syncing, lastError, sync, refreshPending };
}
