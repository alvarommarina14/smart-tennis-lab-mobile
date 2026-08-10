import * as Network from 'expo-network';

import {
  createMatch,
  finishMatch,
  finishSet,
  startSet,
  syncEvents,
  type SyncEvent,
} from '@/api/matches';
import {
  listPendingEvents,
  listPendingMatches,
  listPendingSets,
  markEventsSynced,
  markMatchSynced,
  markSetSynced,
} from '@/db/localMatches';

export type SyncOutcome = {
  ran: boolean;
  pushedMatches: number;
  pushedSets: number;
  pushedEvents: number;
  rejected: { id: string; reason: string }[];
  error?: string;
};

const IDLE: SyncOutcome = {
  ran: false,
  pushedMatches: 0,
  pushedSets: 0,
  pushedEvents: 0,
  rejected: [],
};

let running = false;

export async function isOnline() {
  try {
    const state = await Network.getNetworkStateAsync();
    return Boolean(state.isConnected && state.isInternetReachable !== false);
  } catch {
    return false;
  }
}

export async function syncNow(): Promise<SyncOutcome> {
  if (running) {
    return IDLE;
  }
  if (!(await isOnline())) {
    return { ...IDLE, error: 'Sin conexión' };
  }

  running = true;
  const outcome: SyncOutcome = { ...IDLE, ran: true, rejected: [] };

  try {
    const syncedMatchIds = new Set<string>();

    for (const match of await listPendingMatches()) {
      await createMatch({
        id: match.id,
        playerId: match.player_id,
        opponentName: match.opponent_name,
        tournament: match.tournament,
        surface: match.surface,
        discipline: match.discipline,
        startedAt: match.started_at,
      });

      if (match.status !== 'IN_PROGRESS' && match.finished_at) {
        await finishMatch(match.id, match.status, match.finished_at);
      }

      await markMatchSynced(match.id);
      syncedMatchIds.add(match.id);
      outcome.pushedMatches += 1;
    }

    for (const set of await listPendingSets()) {
      await startSet(set.match_id, set.id, set.set_number, set.started_at);
      if (set.finished_at) {
        await finishSet(set.match_id, set.id, set.finished_at);
      }
      await markSetSynced(set.id);
      outcome.pushedSets += 1;
    }

    const pending = await listPendingEvents();
    const byMatch = new Map<string, SyncEvent[]>();
    const idsByMatch = new Map<string, string[]>();

    for (const event of pending) {
      const payload: SyncEvent = {
        id: event.id,
        setId: event.set_id,
        kpiCode: event.kpi_code,
        occurredAt: event.occurred_at,
        clientSeq: event.client_seq,
        deleted: event.deleted === 1,
      };
      byMatch.set(event.match_id, [...(byMatch.get(event.match_id) ?? []), payload]);
      idsByMatch.set(event.match_id, [...(idsByMatch.get(event.match_id) ?? []), event.id]);
    }

    for (const [matchId, events] of byMatch) {
      const result = await syncEvents(matchId, events);
      await markEventsSynced(idsByMatch.get(matchId) ?? []);
      outcome.pushedEvents += events.length;
      outcome.rejected.push(...result.rejected);
    }

    return outcome;
  } catch (error) {
    return { ...outcome, error: error instanceof Error ? error.message : 'Falló la sincronización' };
  } finally {
    running = false;
  }
}
