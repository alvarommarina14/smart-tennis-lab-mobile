import * as Crypto from 'expo-crypto';

import type { Discipline } from '@/api/kpis';
import type { MatchStatus, Surface } from '@/api/matches';
import { getDatabase } from '@/db/database';

export type LocalMatch = {
  id: string;
  player_id: string;
  player_name: string | null;
  opponent_name: string | null;
  tournament: string | null;
  surface: Surface | null;
  discipline: Discipline;
  status: MatchStatus;
  started_at: string;
  finished_at: string | null;
  synced: number;
};

export type LocalSet = {
  id: string;
  match_id: string;
  set_number: number;
  started_at: string;
  finished_at: string | null;
  synced: number;
};

export type LocalEvent = {
  id: string;
  match_id: string;
  set_id: string | null;
  kpi_code: string;
  occurred_at: string;
  client_seq: number;
  deleted: number;
  synced: number;
};

export function newId() {
  return Crypto.randomUUID();
}

export async function insertLocalMatch(match: {
  id: string;
  playerId: string;
  playerName: string | null;
  opponentName: string | null;
  tournament: string | null;
  surface: Surface | null;
  discipline: Discipline;
  startedAt: string;
}) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO matches
       (id, player_id, player_name, opponent_name, tournament, surface, discipline, status, started_at, finished_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'IN_PROGRESS', ?, NULL, 0)`,
    [
      match.id,
      match.playerId,
      match.playerName,
      match.opponentName,
      match.tournament,
      match.surface,
      match.discipline,
      match.startedAt,
    ]
  );
}

export async function markMatchSynced(matchId: string) {
  const db = await getDatabase();
  await db.runAsync('UPDATE matches SET synced = 1 WHERE id = ?', [matchId]);
}

export async function finishLocalMatch(matchId: string, status: MatchStatus, finishedAt: string) {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE matches SET status = ?, finished_at = ?, synced = 0 WHERE id = ?',
    [status, finishedAt, matchId]
  );
}

export async function getLocalMatch(matchId: string) {
  const db = await getDatabase();
  return db.getFirstAsync<LocalMatch>('SELECT * FROM matches WHERE id = ?', [matchId]);
}

export async function listPendingMatches() {
  const db = await getDatabase();
  return db.getAllAsync<LocalMatch>('SELECT * FROM matches WHERE synced = 0 ORDER BY started_at ASC');
}

export async function listLocalMatches() {
  const db = await getDatabase();
  return db.getAllAsync<LocalMatch>('SELECT * FROM matches ORDER BY started_at DESC');
}

export async function insertLocalSet(set: {
  id: string;
  matchId: string;
  setNumber: number;
  startedAt: string;
}) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO match_sets (id, match_id, set_number, started_at, finished_at, synced)
     VALUES (?, ?, ?, ?, NULL, 0)`,
    [set.id, set.matchId, set.setNumber, set.startedAt]
  );
}

export async function finishLocalSet(setId: string, finishedAt: string) {
  const db = await getDatabase();
  await db.runAsync('UPDATE match_sets SET finished_at = ?, synced = 0 WHERE id = ?', [
    finishedAt,
    setId,
  ]);
}

export async function markSetSynced(setId: string) {
  const db = await getDatabase();
  await db.runAsync('UPDATE match_sets SET synced = 1 WHERE id = ?', [setId]);
}

export async function listSets(matchId: string) {
  const db = await getDatabase();
  return db.getAllAsync<LocalSet>(
    'SELECT * FROM match_sets WHERE match_id = ? ORDER BY set_number ASC',
    [matchId]
  );
}

export async function listPendingSets() {
  const db = await getDatabase();
  return db.getAllAsync<LocalSet>('SELECT * FROM match_sets WHERE synced = 0');
}

export async function recordTap(input: {
  matchId: string;
  setId: string | null;
  kpiCode: string;
}) {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ next: number }>(
    'SELECT COALESCE(MAX(client_seq), 0) + 1 AS next FROM match_events WHERE match_id = ?',
    [input.matchId]
  );
  const clientSeq = row?.next ?? 1;
  const id = newId();

  await db.runAsync(
    `INSERT INTO match_events (id, match_id, set_id, kpi_code, occurred_at, client_seq, deleted, synced)
     VALUES (?, ?, ?, ?, ?, ?, 0, 0)`,
    [id, input.matchId, input.setId, input.kpiCode, new Date().toISOString(), clientSeq]
  );

  return id;
}

export async function undoLastTap(matchId: string) {
  const db = await getDatabase();
  const last = await db.getFirstAsync<LocalEvent>(
    'SELECT * FROM match_events WHERE match_id = ? AND deleted = 0 ORDER BY client_seq DESC LIMIT 1',
    [matchId]
  );
  if (!last) {
    return null;
  }
  await db.runAsync('UPDATE match_events SET deleted = 1, synced = 0 WHERE id = ?', [last.id]);
  return last;
}

export async function countsByKpi(matchId: string) {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ kpi_code: string; total: number }>(
    'SELECT kpi_code, COUNT(*) AS total FROM match_events WHERE match_id = ? AND deleted = 0 GROUP BY kpi_code',
    [matchId]
  );
  return Object.fromEntries(rows.map((row) => [row.kpi_code, row.total]));
}

export async function listPendingEvents(limit = 500) {
  const db = await getDatabase();
  return db.getAllAsync<LocalEvent>(
    'SELECT * FROM match_events WHERE synced = 0 ORDER BY match_id, client_seq LIMIT ?',
    [limit]
  );
}

export async function markEventsSynced(ids: string[]) {
  if (ids.length === 0) {
    return;
  }
  const db = await getDatabase();
  const placeholders = ids.map(() => '?').join(',');
  await db.runAsync(`UPDATE match_events SET synced = 1 WHERE id IN (${placeholders})`, ids);
}

export async function countPendingEvents() {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM match_events WHERE synced = 0'
  );
  return row?.total ?? 0;
}
