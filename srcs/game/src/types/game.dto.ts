/* ===========================
 * Match DB
 * =========================== */
export interface MatchDTO {
  id: number;
  tournament_id: number | null;
  player1: number;
  player2: number;
  score_player1: number;
  score_player2: number;
  winner_id: number;
  round: string | null;
  created_at: number;
}
