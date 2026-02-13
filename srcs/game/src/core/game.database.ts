import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { MatchDTO } from '../types/game.dto.js';

// DB path
const DEFAULT_DIR = path.join(process.cwd(), 'data');
const DB_PATH = process.env.GAME_DB_PATH || path.join(DEFAULT_DIR, 'game.db');

// Check dir
try {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
} catch (err) {
  const e: any = new Error(
    `Failed to ensure DB directory: ${(err as any)?.message || String(err)}`,
  );
  throw e;
}

export const db = new Database(DB_PATH);
console.log('Using SQLite file:', DB_PATH);

// Create table
try {
  db.exec(`
CREATE TABLE IF NOT EXISTS match(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER, -- NULL if free match
    player1 INTEGER NOT NULL,
    player2 INTEGER NOT NULL,
    score_player1 INTEGER NOT NULL DEFAULT 0,
    score_player2 INTEGER NOT NULL DEFAULT 0,
    winner_id INTEGER NOT NULL,
    round TEXT, --NULL | SEMI_1 | SEMI_2 | LITTLE_FINAL | FINAL
    created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tournament(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING | STARTED | FINISHED
    created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tournament_player(
    tournament_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    final_position INTEGER,
    PRIMARY KEY (tournament_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_match_tournament
ON match(tournament_id);

CREATE INDEX IF NOT EXISTS idx_tournament_player_tid
ON tournament_player(tournament_id);
`);
} catch (err) {
  const e: any = new Error(
    `Failed to initialize DB schema: ${(err as any)?.message || String(err)}`,
  );
  throw e;
}

const addMatchStmt = db.prepare(`
INSERT INTO match(tournament_id, player1, player2, score_player1, score_player2, winner_id, created_at)
VALUES (?,?,?,?,?,?,?)
`);

const createTournamentStmt = db.prepare(`
INSERT INTO tournament(creator_id, created_at)
VALUES (?,?)
`);

const addPlayerTournamentStmt = db.prepare(`
INSERT INTO tournament_player(player_id, tournament_id)
VALUES(?,?)
`);

const addPlayerPositionTournamentStmt = db.prepare(`
UPDATE tournament_player
SET
  final_position = ?
WHERE tournament_id = ? and player_id = ?
  `);

export function addMatch(match: MatchDTO): number {
  try {
    const idmatch = addMatchStmt.run(
      match.tournament_id,
      match.player1,
      match.player2,
      match.score_player1,
      match.score_player2,
      match.winner_id,
      match.created_at,
    );
    return Number(idmatch.lastInsertRowid);
  } catch (err: any) {
    const error: any = new Error(`Error during Match storage: ${err?.message || err}`);
    error.code = 'DB_INSERT_MATCH_ERR';
    throw error;
  }
}

export function createTournament(player: number): number {
  try {
    const idtournament = createTournamentStmt.run(player, Date.now());
    return Number(idtournament.lastInsertRowid);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const error = new Error(`Tournament creation failed: ${message}`) as Error & { code: string };
    error.code = 'DB_INSERT_TOURNAMENT_ERR';
    throw error;
  }
}

export function addPlayerTournament(player: number, tournament: number) {
  try {
    addPlayerTournamentStmt.run(player, tournament);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const error = new Error(`Add Player to a tournament failed: ${message}`) as Error & {
      code: string;
    };
    error.code = 'DB_UPDATE_TOURNAMENT_ERROR';
    throw error;
  }
}

export function addPlayerPositionTournament(player: number, position: number, tournament: number) {
  try {
    addPlayerPositionTournamentStmt.run(position, tournament, player);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const error = new Error(`Add player position failed: ${message}`) as Error & { code: string };
    error.code = 'DB_UPDATE_PLAYER_POSITION';
    throw error;
  }
}
