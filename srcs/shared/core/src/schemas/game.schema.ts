/* ===========================
 * Tournaments list DB
 * =========================== */
export interface TournamentDTO {
  id: number;
  username: string;
  status: string;
  player_count: number;
}

export interface PlayerDTO {
  player_id: number;
  username: string;
  avatar: string | null;
}
