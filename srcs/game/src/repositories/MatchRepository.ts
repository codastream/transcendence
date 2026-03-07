// ============================================================================
// MatchRepository — CRUD for match records (free + tournament)
// ============================================================================

import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { AppError, ERR_DEFS } from '@transcendence/core';
import { GUEST_USER_ID } from '../types/game.types.js';

export class MatchRepository {
  private createFreeMatchStmt;
  private getMatchBySessionIdStmt;
  private updateMatchResultStmt;
  private getMatchByIdStmt;
  private countFinishedSemisStmt;
  private getMatchByRoundStmt;
  private createMatchStmt;
  private getMatchHistoryStmt;
  private ensureGuestPlayerStmt;
  private db;

  constructor(db: Database.Database) {
    this.db = db;
    this.createFreeMatchStmt = db.prepare(`
      INSERT INTO match (tournament_id, player1, player2, sessionId, score_player1, score_player2, winner_id, round, created_at)
      VALUES (NULL, ?, ?, ?, ?, ?, ?, NULL, ?)
    `);
    this.getMatchBySessionIdStmt = db.prepare(`
      SELECT id, tournament_id, player1, player2, round, winner_id FROM match WHERE sessionId = ?
    `);
    this.updateMatchResultStmt = db.prepare(`
      UPDATE match SET score_player1 = ?, score_player2 = ?, winner_id = ? WHERE id = ?
    `);
    this.getMatchByIdStmt = db.prepare(`
      SELECT tournament_id, player1, player2, round, winner_id FROM match WHERE id = ?
    `);
    this.countFinishedSemisStmt = db.prepare(`
      SELECT COUNT(*) AS count FROM match
      WHERE tournament_id = ? AND round IN ('SEMI_1', 'SEMI_2') AND winner_id IS NOT NULL
    `);
    this.getMatchByRoundStmt = db.prepare(`
      SELECT player1, player2, winner_id FROM match WHERE tournament_id = ? AND round = ?
    `);
    this.createMatchStmt = db.prepare(`
      INSERT INTO match(tournament_id, player1, player2, sessionId, round, created_at)
      VALUES(?,?,?,?,?,?)
    `);
    this.getMatchHistoryStmt = db.prepare(`
      SELECT
        m.id, m.tournament_id, m.round, m.player1, m.player2,
        m.score_player1, m.score_player2, m.winner_id, m.created_at,
        p1.username AS username_player1,
        p2.username AS username_player2,
        pw.username AS username_winner,
        CASE
          WHEN m.player1 = ? THEN p2.username
          ELSE p1.username
        END AS opponent_username,
        CASE
          WHEN m.winner_id IS NULL THEN 'PENDING'
          WHEN m.winner_id = ? THEN 'WIN'
          ELSE 'LOSS'
        END AS result
      FROM match m
      LEFT JOIN player p1 ON p1.id = m.player1
      LEFT JOIN player p2 ON p2.id = m.player2
      LEFT JOIN player pw ON pw.id = m.winner_id
      WHERE (m.player1 = ? OR m.player2 = ?)
      ORDER BY m.created_at DESC
      LIMIT ?
    `);
    this.ensureGuestPlayerStmt = db.prepare(`
      INSERT OR IGNORE INTO player (id, username, avatar, updated_at) VALUES (?, 'Guest', NULL, ?)
    `);
  }
  /**
   * Persist a free (non-tournament) match.
   * @returns The inserted match ID.
   */
  createFreeMatch(
    player1: number,
    player2: number,
    sessionId: string,
    scorePlayer1: number,
    scorePlayer2: number,
    winnerId: number,
  ): number {
    try {
      const result = this.createFreeMatchStmt.run(
        player1,
        player2,
        sessionId,
        scorePlayer1,
        scorePlayer2,
        winnerId,
        Date.now(),
      );
      return Number(result.lastInsertRowid);
    } catch (err: unknown) {
      throw new AppError(
        ERR_DEFS.DB_INSERT_ERROR,
        { details: [{ field: `createFreeMatch session=${sessionId}` }] },
        err,
      );
    }
  }

  /**
   * Get match by sessionId. Returns null if no DB match (free game not yet created).
   */
  getMatchBySessionId(sessionId: string): {
    id: number;
    tournament_id: number | null;
    player1: number;
    player2: number;
    round: string | null;
    winner_id: number | null;
  } | null {
    try {
      const row = this.getMatchBySessionIdStmt.get(sessionId) as any;
      return row || null;
    } catch (err: unknown) {
      throw new AppError(
        ERR_DEFS.DB_SELECT_ERROR,
        { details: [{ field: `getMatchBySessionId ${sessionId}` }] },
        err,
      );
    }
  }

  /**
   * Update match result + trigger bracket progression (onMatchFinished).
   */
  updateMatchResult(
    matchId: number,
    scorePlayer1: number,
    scorePlayer2: number,
    winnerId: number,
  ): void {
    this.updateMatchResultStmt.run(scorePlayer1, scorePlayer2, winnerId, matchId);
    this.onMatchFinished(matchId);
  }

  /**
   * After a match finishes: if it's a semi-final and both semis are done,
   * create the FINAL and LITTLE_FINAL matches.
   */
  private onMatchFinished(matchId: number): void {
    this.db.transaction(() => {
      const match = this.getMatchByIdStmt.get(matchId) as {
        tournament_id: number;
        player1: number;
        round: string;
        winner_id: number;
      };
      if (!match) throw new Error('Match not found');
      if (match.round !== 'SEMI_1' && match.round !== 'SEMI_2') return;

      const semisFinished = (
        this.countFinishedSemisStmt.get(match.tournament_id) as { count: number }
      ).count;
      if (semisFinished !== 2) return;

      const semi1 = this.getMatchByRoundStmt.get(match.tournament_id, 'SEMI_1') as
        | {
            player1: number;
            player2: number;
            winner_id: number | null;
          }
        | undefined;
      const semi2 = this.getMatchByRoundStmt.get(match.tournament_id, 'SEMI_2') as
        | {
            player1: number;
            player2: number;
            winner_id: number | null;
          }
        | undefined;

      const winner1 = semi1?.winner_id;
      const winner2 = semi2?.winner_id;
      const loser1 = semi1?.player1 === winner1 ? semi1?.player2 : semi1?.player1;
      const loser2 = semi2?.player1 === winner2 ? semi2?.player2 : semi2?.player1;

      const now = Date.now();

      this.createMatchStmt.run(match.tournament_id, winner1, winner2, randomUUID(), 'FINAL', now);
      this.createMatchStmt.run(
        match.tournament_id,
        loser1,
        loser2,
        randomUUID(),
        'LITTLE_FINAL',
        now,
      );
    })();
  }

  getMatchHistory(userId: number, limit: number = 100): any[] {
    try {
      return this.getMatchHistoryStmt.all(userId, userId, userId, userId, limit) as any[];
    } catch (err: unknown) {
      throw new AppError(
        ERR_DEFS.DB_SELECT_ERROR,
        { details: [{ field: 'getMatchHistory' }] },
        err,
      );
    }
  }

  ensureGuestPlayer(): void {
    try {
      this.ensureGuestPlayerStmt.run(GUEST_USER_ID, Date.now());
    } catch (err: unknown) {
      throw new AppError(
        ERR_DEFS.DB_INSERT_ERROR,
        { details: [{ field: 'ensureGuestPlayer' }] },
        err,
      );
    }
  }
}
