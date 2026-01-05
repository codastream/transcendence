import { ContractTransactionReceipt, LogDescription } from 'ethers';
import { keccak256, AbiCoder } from 'ethers';

const abi = AbiCoder.defaultAbiCoder();

export function computeBusinessHash(
  id: number,
  p1: number,
  p2: number,
  p3: number,
  p4: number,
  ts: number,
): string {
  return keccak256(
    abi.encode(
      ['uint32', 'uint32', 'uint32', 'uint32', 'uint32', 'uint32'],
      [id, p1, p2, p3, p4, ts],
    ),
  );
}

export interface TournamentStoredEvent {
  tour_id: number;
  p1: number;
  p2: number;
  p3: number;
  p4: number;
  ts: number;
  snapshotHash: string;
}

export function extractTournamentStoredEvent(
  receipt: ContractTransactionReceipt,
  gameStorage: any,
): TournamentStoredEvent {
  for (const log of receipt.logs) {
    let parsed: LogDescription | null = null;

    try {
      parsed = gameStorage.interface.parseLog(log);
    } catch {
      continue;
    }

    if (!parsed || parsed.name !== 'TournamentStored') continue;

    const args = parsed.args;

    return {
      tour_id: Number(args.tour_id),
      p1: Number(args.p1),
      p2: Number(args.p2),
      p3: Number(args.p3),
      p4: Number(args.p4),
      ts: Number(args.timestamp),
      snapshotHash: args.businessHash as string,
    };
  }

  throw new Error('TournamentStored event not found in transaction receipt');
}
