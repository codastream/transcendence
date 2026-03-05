// Game state interface matching server updates
export interface Vector2D {
  x: number;
  y: number;
}

// ── Types utilisés dans TournamentPage ────────────────────────────────────────

export type PlayerStatus = 'waiting' | 'connected';

export type Player = {
  id: string;
  name: string;
  avatar: string | null;
  slot: 1 | 2 | 3 | 4;
  online: boolean;
  status: PlayerStatus;
};

export type MatchStatus = 'pending' | 'ready' | 'running' | 'finished';
