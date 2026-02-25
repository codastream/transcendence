import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { MatchDTO } from '../types/game.dto.js';
import { env } from '../config/env.js';
import { UserEvent, TournamentDTO, ERR_DEFS } from '@transcendence/core';
import { AppError, ErrorDetail } from '@transcendence/core';
import { randomUUID } from 'crypto';

// DB path
const DEFAULT_DIR = path.join(process.cwd(), 'data');
const DB_PATH = env.GAME_DB_PATH || path.join(DEFAULT_DIR, 'game.db');

// Check dir
try {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
} catch (err: unknown) {
  throw new AppError(
    ERR_DEFS.SERVICE_GENERIC,
    { details: [{ field: `Failed to ensure DB directory` }] },
    err,
  );
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
    sessionId TEXT,-- NULL if match not started, otherwise the sessionId of the game instance
    score_player1 INTEGER NOT NULL DEFAULT 0,
    score_player2 INTEGER NOT NULL DEFAULT 0,
    winner_id INTEGER NOT NULL,
    round TEXT, --NULL | SEMI_1 | SEMI_2 | LITTLE_FINAL | FINAL
    created_at INTEGER NOT NULL,
    FOREIGN KEY (tournament_id) REFERENCES tournament(id) ON DELETE CASCADE,
    FOREIGN KEY (player1) REFERENCES player(id) ON DELETE CASCADE,
    FOREIGN KEY (player2) REFERENCES player(id) ON DELETE CASCADE,
    FOREIGN KEY (winner_id) REFERENCES player(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tournament(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING | STARTED | FINISHED
    created_at INTEGER NOT NULL,
    FOREIGN KEY (creator_id) REFERENCES player(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tournament_player(
    tournament_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    final_position INTEGER, -- NULL | 1 | 2 | 3 | 4
    FOREIGN KEY (tournament_id) REFERENCES tournament(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES player(id) ON DELETE CASCADE,
    PRIMARY KEY (tournament_id, player_id)
);

CREATE TABLE IF NOT EXISTS player (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL,
    avatar TEXT,-- NULL if not synchronised with user service
    updated_at INTEGER NOT NULL,
);

CREATE INDEX IF NOT EXISTS idx_match_tournament
ON match(tournament_id);

CREATE INDEX IF NOT EXISTS idx_tournament_player_tid
ON tournament_player(tournament_id);
`);
} catch (err: unknown) {
  throw new AppError(
    ERR_DEFS.SERVICE_GENERIC,
    { details: [{ field: `Failed to initialize DB schema` }] },
    err,
  );
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
SELECT tp.player_id, p.username, p.avatar
FROM tournament_player tp
LEFT JOIN player p
ON  tp.player_id = p.id
WHERE tournament_id = ?
`);

const isPlayerInTournamentStmt = db.prepare(`
SELECT *
FROM tournament_player
WHERE player_id = ? and tournament_id  = ?
`);

const getUserStmt = db.prepare(`
SELECT *
FROM player
WHERE id = ?`);

const getPalyerStatsStmt = db.prepare(`
SELECT *
FROM match
WHERE player1 = ? OR player2 = ?`);

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
    throw new AppError(
      ERR_DEFS.DB_INSERT_ERROR,
      { details: [{ field: `addMatch to tournament ${match.tournament_id}` }] },
      err,
    );
  }
}

export function createTournament(player_id: number): number {
  try {
    const idtournament = createTournamentStmt.run(player_id, Date.now());
    addPlayerTournament(player_id, Number(idtournament.lastInsertRowid));
    return Number(idtournament.lastInsertRowid);
  } catch (err: unknown) {
    throw new AppError(
      ERR_DEFS.DB_INSERT_ERROR,
      { details: [{ field: `createTournament ${player_id}` }] },
      err,
    );
  }
}

export function addPlayerTournament(player: number, tournament: number) {
  try {
    addPlayerTournamentStmt.run(player, tournament);
  } catch (err: unknown) {
    throw new AppError(
      ERR_DEFS.DB_UPDATE_ERROR,
      { details: [{ field: `addPlayerTournament ${player} ${tournament}` }] },
      err,
    );
  }
}

export function addPlayerPositionTournament(player: number, position: number, tournament: number) {
  try {
    addPlayerPositionTournamentStmt.run(position, tournament, player);
  } catch (err: unknown) {
    throw new AppError(
      ERR_DEFS.DB_UPDATE_ERROR,
      { details: [{ field: `addPlayerPositionTournament ${player} ${position} ${tournament}` }] },
      err,
    );
  }
}

export async function upsertUser(user: UserEvent) {
  try {
    upsertUserStmt.run(user.id, user.username, user.avatar, user.timestamp);
  } catch (err: unknown) {
    throw new AppError(
      ERR_DEFS.DB_UPDATE_ERROR,
      { details: [{ field: `upsertUser ${user.id}` }] },
      err,
    );
  }
}

export async function deleteUser(id: number) {
  try {
    deleteUserStmt.run(id);
  } catch (err: unknown) {
    throw new AppError(ERR_DEFS.DB_DELETE_ERROR, { details: [{ field: `deleteUser ${id}` }] }, err);
  }
}

export function listTournaments(): TournamentDTO[] {
  try {
    const rows = listTournamentsStmt.all() as TournamentDTO[];
    return rows;
  } catch (err: unknown) {
    throw new AppError(ERR_DEFS.DB_SELECT_ERROR, { details: [{ field: `listTournaments` }] }, err);
  }
}

export function joinTournament(player_id: number, tournament_id: number) {
  try {
    //db transaction to avoid race condition when multiple players try to join the same tournament
    const transaction = db.transaction(() => {
      const result = countPlayerTournamentStmt.get(tournament_id) as { nbPlayer: number };
      const isAlreadyInGame = isPlayerInTournamentStmt.get(player_id, tournament_id);
      if (isAlreadyInGame) return;
      const nbPlayers = result['nbPlayer'];
      if (nbPlayers >= 4) {
        const errorDetail: ErrorDetail = {
          field: `tournament full: ${tournament_id}`,
          message: 'Tournament is already full',
          reason: 'tournament_full',
        };
        throw new AppError(ERR_DEFS.DB_UPDATE_ERROR, { details: [errorDetail] });
      }
      addPlayerTournament(player_id, tournament_id);
      if (nbPlayers === 3) {
        changeStatusTournamentStmt.run('STARTED', tournament_id);
      }
    });
    transaction();
  } catch (err: unknown) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      ERR_DEFS.DB_UPDATE_ERROR,
      { details: [{ field: `joinTournament: ${tournament_id}` }] },
      err,
    );
  }
}

export function showTournament(tournament_id: number) {
  try {
    const result = listPlayersTournamentStmt.all(tournament_id);
    return result;
  } catch (err: unknown) {
    throw new AppError(
      ERR_DEFS.DB_SELECT_ERROR,
      { details: [{ field: `showTournament: ${tournament_id}` }] },
      err,
    );
  }
}

export function getUser(id: number) {
  try {
    const result = getUserStmt.get(id);
    if (!result) {
      throw new AppError(ERR_DEFS.USER_NOTFOUND_ERRORS, { userId: id });
    }
    return result;
  } catch (err: unknown) {
    if (err instanceof AppError) throw err;
    throw new AppError(ERR_DEFS.DB_SELECT_ERROR, { details: [{ field: `getUser ${id}` }] }, err);
  }
}

export function getPlayerStats(player_id: number) {
  try {
    const result = getPalyerStatsStmt.all(player_id);
    return result;
  } catch (err: unknown) {
    throw new AppError(
      ERR_DEFS.DB_SELECT_ERROR,
      { details: [{ field: `getPlayerStats ${player_id}` }] },
      err,
    );
  }
}

const getMatchSmt = db.prepare(`
SELECT sessionId , round, player1, player2
FROM match
WHERE tournament_id = ? AND (player1 = ? OR player2 = ?)
`);

const createPlayer1Match = db.prepare(`
INSERT INTO match(tournament_id, player1, round, sessionId, created_at)
VALUES (?,?,?,?,?)
`);
const createPlayer2Match = db.prepare(`
INSERT INTO match(tournament_id, player2, round, sessionId, created_at)
VALUES (?,?,?,?,?)
`);

export async function getSessionGame(
  tournamentId: number | null,
  userId: number | null,
): Promise<string | null> {
  try {
    const tournamentHaveMatch = getMatchSmt.all(tournamentId, userId) as {
      sessionId: string | null;
      round: string;
      player1: number;
      player2: number | null;
    }[];
    if (tournamentHaveMatch.length === 0)
      createPlayer1Match.run(tournamentId, userId, 'SEMI_1', randomUUID(), Date.now());
    else if (tournamentHaveMatch.length === 1 && tournamentHaveMatch[0].player2 == null)
      createPlayer2Match.run(tournamentId, userId, 'SEMI_1', randomUUID(), Date.now());
    else if (tournamentHaveMatch.length === 1 && tournamentHaveMatch[0].player2 != null)
      createPlayer1Match.run(tournamentId, userId, 'SEMI_2', randomUUID(), Date.now());
    else if (tournamentHaveMatch.length === 2 && tournamentHaveMatch[1].player2 == null)
      createPlayer2Match.run(tournamentId, userId, 'SEMI_2', randomUUID(), Date.now());
    else if (tournamentHaveMatch.length === 2 && tournamentHaveMatch[1].player2 != null)
      createPlayer1Match.run(tournamentId, userId, 'LITTLE_FINAL', randomUUID(), Date.now());
    else if (tournamentHaveMatch.length === 3 && tournamentHaveMatch[2].player2 == null)
      createPlayer2Match.run(tournamentId, userId, 'LITTLE_FINAL', randomUUID(), Date.now());
    else if (tournamentHaveMatch.length === 3 && tournamentHaveMatch[2].player2 != null)
      createPlayer1Match.run(tournamentId, userId, 'FINAL', randomUUID(), Date.now());
    else if (tournamentHaveMatch.length === 4 && tournamentHaveMatch[3].player2 == null)
      createPlayer2Match.run(tournamentId, userId, 'FINAL', randomUUID(), Date.now());
    const sessionId =
      tournamentHaveMatch.length > 0
        ? tournamentHaveMatch[tournamentHaveMatch.length - 1].sessionId
        : null;
    return sessionId;
  } catch (err: unknown) {
    throw new AppError(
      ERR_DEFS.DB_SELECT_ERROR,
      { details: [{ field: `getSessionGame tournamentId:${tournamentId} userId:${userId}` }] },
      err,
    );
  }
}
