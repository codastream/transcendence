import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { MatchDTO } from '../types/game.dto.js';
import { env } from '../config/env.js';
import { UserEvent, TournamentDTO } from '@transcendence/core';

// DB path
const DEFAULT_DIR = path.join(process.cwd(), 'data');
const DB_PATH = env.GAME_DB_PATH || path.join(DEFAULT_DIR, 'game.db');

// Check dir
try {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  const error = new Error(`Failed to ensure DB directory: ${message}`) as Error & { code: string };
  error.code = 'GAME_DB_DIRECTORY_ERROR';
  throw error;
}

export const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');
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

CREATE TABLE IF NOT EXISTS player (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    avatar TEXT,
    updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_match_tournament
ON match(tournament_id);

CREATE INDEX IF NOT EXISTS idx_tournament_player_tid
ON tournament_player(tournament_id);
`);
} catch (err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  const error = new Error(`Failed to initialize DB schema: ${msg}`) as Error & { code: string };
  error.code = 'GAME_DB_INIT_FAILED';
  throw error;
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
//COALESCE avoid null if username not synchronised
const listTournamentsStmt = db.prepare(`
SELECT 
  t.id,
  t.status,
  COALESCE(p.username, 'unknown') as username,
  COUNT(tp.player_id) as player_count
FROM tournament t
LEFT JOIN tournament_player tp 
  ON t.id = tp.tournament_id
LEFT JOIN player p 
  ON p.id = t.creator_id
WHERE t.status IN ('PENDING', 'STARTED')
GROUP BY t.id, t.status, p.username;
`);

const countPlayerTournamentStmt = db.prepare(`
SELECT COUNT(*) as nbPlayer
FROM tournament_player
WHERE tournament_id = ?;
`);

const upsertUserStmt = db.prepare(`
INSERT INTO player (id, username, avatar, updated_at)
VALUES (?, ?, ?, ?)
ON CONFLICT(id)
DO UPDATE SET
  username = excluded.username,
  avatar = excluded.avatar,
  updated_at = excluded.updated_at
`);

const deleteUserStmt = db.prepare(`
DELETE FROM player WHERE id = ?
`);

const changeStatusTournamentStmt = db.prepare(`
UPDATE tournament
SET status = ?
WHERE id = ?
`);

const listPlayersTournamentStmt = db.prepare(`
SELECT tp.player_id, p.username
FROM tournament_player tp
LEFT JOIN player p
ON  tp.player_id = p.id
WHERE tournament_id = ?
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const error: any = new Error(`Error during Match storage: ${message}`) as Error & {
      code: string;
    };
    error.code = 'Game_DB_INSERT_MATCH_ERR';
    throw error;
  }
}

export function createTournament(player_id: number): number {
  try {
    const idtournament = createTournamentStmt.run(player_id, Date.now());
    addPlayerTournament(player_id, Number(idtournament.lastInsertRowid));
    return Number(idtournament.lastInsertRowid);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const error = new Error(`Tournament creation failed: ${message}`) as Error & { code: string };
    error.code = 'GAME_DB_INSERT_TOURNAMENT_ERR';
    throw error;
  }
}

export function addPlayerTournament(player: number, tournament: number) {
  try {
    addPlayerTournamentStmt.run(player, tournament);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const error = new Error(
      `Add Player(${player}) to a tournament(${tournament}) failed: ${message}`,
    ) as Error & {
      code: string;
    };
    error.code = 'GAME_DB_UPDATE_TOURNAMENT_ERROR';
    throw error;
  }
}

export function addPlayerPositionTournament(player: number, position: number, tournament: number) {
  try {
    addPlayerPositionTournamentStmt.run(position, tournament, player);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const error = new Error(`Add player position failed: ${message}`) as Error & { code: string };
    error.code = 'GAME_DB_UPDATE_PLAYER_POSITION';
    throw error;
  }
}

export async function upsertUser(user: UserEvent) {
  try {
    upsertUserStmt.run(user.id, user.username, user.avatar, user.timestamp);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const error = new Error(`Add or Update player failed: ${message}`) as Error & { code: string };
    error.code = 'GAME_DB_UPSERT_FAILED';
    throw error;
  }
}

export async function deleteUser(id: number) {
  try {
    deleteUserStmt.run(id);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const error = new Error(`Delete user failed: ${message}`) as Error & { code: string };
    error.code = 'GAME_DB_DELETE_USER_FAILED';
    throw error;
  }
}

export function listTournaments(): TournamentDTO[] {
  try {
    const rows = listTournamentsStmt.all() as TournamentDTO[];
    return rows;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const error = new Error(`Failed to list tournaments: ${message}`) as Error & { code: string };
    error.code = 'GAME_DB_TOURNAMENT_LIST_ERROR';
    throw error;
  }
}

export function joinTournament(player_id: number, tournament_id: number) {
  try {
    const result = countPlayerTournamentStmt.get(tournament_id) as { nbPlayer: number };
    const nbPlayers = result['nbPlayer'];
    if (nbPlayers >= 4) {
      const fullError = new Error('The Tournament is full') as Error & { code: string };
      fullError.code = 'TOURNAMENT_FULL';
      throw fullError;
    }
    addPlayerTournament(player_id, tournament_id);
    if (nbPlayers === 3) {
      changeStatusTournamentStmt.run('STARTED', tournament_id);
    }
  } catch (err: unknown) {
    if (err instanceof Error && (err as any).code === 'TOURNAMENT_FULL') {
      throw err;
    }
    const message = err instanceof Error ? err.message : String(err);
    const error = new Error(`Join tournament failed: ${message}`) as Error & { code: string };
    error.code = 'GAME_DB_JOIN_TOURNAMENT_ERR';
    throw error;
  }
}

export function showTournament(tournament_id: number) {
  try {
    const result = listPlayersTournamentStmt.all(tournament_id);
    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const error = new Error(`This tournament don't exist: ${message}`) as Error & { code: string };
    error.code = 'GAME_DB_TOURNAMENT_NOT_FOUND';
  }
}
