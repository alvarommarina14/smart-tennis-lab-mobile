import { fetchMatches, type MatchSummary } from '@/api/matches';
import { listLocalMatches, type LocalMatch } from '@/db/localMatches';

export async function loadMatchFeed(playerId?: string): Promise<MatchSummary[]> {
  const local = (await listLocalMatches()).filter(
    (match) => playerId === undefined || match.player_id === playerId
  );
  const byId = new Map<string, MatchSummary>();

  try {
    for (const match of await fetchMatches(playerId)) {
      byId.set(match.id, match);
    }
  } catch (caught) {
    if (local.length === 0) {
      throw caught;
    }
  }

  for (const match of local) {
    if (!byId.has(match.id) || match.synced === 0) {
      byId.set(match.id, toSummary(match));
    }
  }

  return [...byId.values()].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

function toSummary(match: LocalMatch): MatchSummary {
  return {
    id: match.id,
    playerId: match.player_id,
    playerName: match.player_name,
    opponentName: match.opponent_name,
    status: match.status,
    startedAt: match.started_at,
    finishedAt: match.finished_at,
  };
}
