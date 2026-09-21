import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'smarttennislab.db';

let connection: Promise<SQLite.SQLiteDatabase> | null = null;

const SCHEMA = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS matches (
  id            TEXT PRIMARY KEY NOT NULL,
  player_id     TEXT NOT NULL,
  player_name   TEXT,
  opponent_name TEXT,
  tournament    TEXT,
  surface       TEXT,
  discipline    TEXT NOT NULL DEFAULT 'SINGLES',
  format        TEXT NOT NULL DEFAULT 'BEST_OF_3_SETS',
  status        TEXT NOT NULL DEFAULT 'IN_PROGRESS',
  started_at    TEXT NOT NULL,
  finished_at   TEXT,
  synced        INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS match_sets (
  id          TEXT PRIMARY KEY NOT NULL,
  match_id    TEXT NOT NULL,
  set_number  INTEGER NOT NULL,
  started_at  TEXT NOT NULL,
  finished_at TEXT,
  synced      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS match_events (
  id          TEXT PRIMARY KEY NOT NULL,
  match_id    TEXT NOT NULL,
  set_id      TEXT,
  kpi_code    TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  client_seq  INTEGER NOT NULL,
  deleted     INTEGER NOT NULL DEFAULT 0,
  synced      INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS ix_events_match ON match_events (match_id, client_seq);
CREATE INDEX IF NOT EXISTS ix_events_pending ON match_events (synced);
`;

export function getDatabase() {
  if (!connection) {
    connection = openAndMigrate().catch((error) => {
      connection = null;
      throw error;
    });
  }
  return connection;
}

async function openAndMigrate() {
  const database = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await database.execAsync(SCHEMA);
  await addMissingColumns(database);
  return database;
}

// CREATE TABLE IF NOT EXISTS no agrega columnas a una base que ya existe en el celular del profe.
async function addMissingColumns(db: SQLite.SQLiteDatabase) {
  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(matches)');
  if (!columns.some((column) => column.name === 'format')) {
    await db.execAsync(
      "ALTER TABLE matches ADD COLUMN format TEXT NOT NULL DEFAULT 'BEST_OF_3_SETS'"
    );
  }
}

export async function resetDatabase() {
  const db = await getDatabase();
  await db.execAsync(
    'DELETE FROM match_events; DELETE FROM match_sets; DELETE FROM matches;'
  );
}
