// Params for /row/:id
export const blockIdSchema = {
  type: 'object',
  properties: {
    tx_id: { type: 'number' },
  },
  required: ['id'],
} as const;

// Body for POST /
export const blockSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    tx_hash: { type: 'string' },
    snap_hash: { type: 'string' },
    block_timestamp: { type: 'integer' },
    tour_id: { type: 'integer', minimum: 1 },
    player1_id: { type: 'integer', minimum: 1 },
    player2_id: { type: 'integer', minimum: 1 },
    player3_id: { type: 'integer', minimum: 1 },
    player4_id: { type: 'integer', minimum: 1 },
  },
  required: ['id', 'tour_id', 'player1_id', 'player2_id', 'player3_id', 'player4_id'],
  additionalProperties: false,
} as const;

export interface BlockTournamentInput {
  id: number;
  tx_hash?: string;
  snap_hash?: string;
  block_timestamp?: number;
  tour_id: number;
  player1_id: number;
  player2_id: number;
  player3_id: number;
  player4_id: number;
}

export interface BlockTournamentStored extends BlockTournamentInput {
  tx_hash: string;
  snap_hash: string;
  block_timestamp: number;
}
