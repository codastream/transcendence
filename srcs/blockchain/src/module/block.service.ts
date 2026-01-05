import { getGameStorage } from '../core/GameStorage.client.js';
import { BlockTournamentInput, BlockTournamentStored } from './block.schema.js';
import { FastifyInstance } from 'fastify';
import type { AppLogger } from '../core/logger.js';
import { extractTournamentStoredEvent, computeBusinessHash } from '../core/GameStorage.utils.js';
import * as db from '../core/database.js';

export async function storeTournament(
  logger: AppLogger,
  tournament: BlockTournamentInput,
): Promise<BlockTournamentStored> {
  logger.info({
    event: 'blockchain_env_check',
    BLOCKCHAIN_READY: process.env.BLOCKCHAIN_READY,
    GAME_STORAGE_ADDRESS: !!process.env.GAME_STORAGE_ADDRESS,
    AVALANCHE_RPC_URL: !!process.env.AVALANCHE_RPC_URL,
  });

  const gamestorage = getGameStorage(logger);
  if (!gamestorage) {
    const error: any = new Error(
      `Error during Tournament Blockchain storage: Smart Contract don't exist`,
    );
    error.code = 'BLOCKCHAIN_NO_SMART_CONTRACT_ERR';
    throw error;
  }

  try {
    const tx = await gamestorage.storeTournament(
      tournament.id,
      tournament.player1_id,
      tournament.player2_id,
      tournament.player3_id,
      tournament.player4_id,
    );

    const receipt = await tx.wait();
    if (!receipt) {
      throw new Error('Transaction receipt missing');
    }
    const event = extractTournamentStoredEvent(receipt, gamestorage);

    const localHash = computeBusinessHash(
      event.tour_id,
      event.p1,
      event.p2,
      event.p3,
      event.p4,
      event.ts,
    );
    if (localHash !== event.snapshotHash) {
      throw new Error('Business hash mismatch — integrity violation');
    }
    return {
      ...tournament,
      tx_hash: receipt.hash,
      snap_hash: localHash,
      block_timestamp: event.ts,
    };
  } catch (err: any) {
    const error: any = new Error(
      `Error during Tournament Blockchain storage: ${err?.message || err}`,
    );
    error.code = 'BLOCKCHAIN_INSERT_TOURNAMENT_ERR';
    throw error;
  }
}

export function addTournamentSnapDB(logger: AppLogger, data: BlockTournamentInput) {
  logger.info({ event: 'snapshot_register_attempt', tournament: data });
  const rowSnapId = db.insertSnapTournament(data);
  logger.info({ event: 'snapshot_register_success', tournament: data });
}

export async function addTournamentBlockchain(
  logger: AppLogger,
  data: BlockTournamentInput,
): Promise<BlockTournamentStored> {
  logger.info({
    event: 'blockchain_register_attempt',
    data,
  });
  const tournament: BlockTournamentStored = await storeTournament(logger, data);
  logger.info({ event: 'blockchain_register_success', tournament: tournament });
  return tournament;
}

export function updateTournamentSnapDB(logger: AppLogger, data: BlockTournamentStored) {
  logger.info({ event: 'snapshot_update_attempt', tournament: data });
  const rowBlockId = db.updateTournament(
    data.id,
    data.tx_hash,
    data.snap_hash,
    data.block_timestamp,
  );
  logger.info({ event: 'snapshot_update_success', tournament: data, rowBlockId });
}

// export async function listBlockchainTournaments(): Promise<map<string, string>> {
//
// }
