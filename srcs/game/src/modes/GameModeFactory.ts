// ============================================================================
// GameModeFactory — Resolves the IGameMode strategy from a mode string
// ============================================================================

import { GameMode } from '../types/game.types.js';
import { IGameMode } from './IGameMode.js';
import { LocalMode } from './LocalMode.js';
import { RemoteMode } from './RemoteMode.js';
import { TournamentMode } from './TournamentMode.js';
import { AiMode } from './AiMode.js';
import type { MatchRepository } from '../repositories/MatchRepository.js';
import type { TournamentRepository } from '../repositories/TournamentRepository.js';

export function createGameMode(
  mode: GameMode,
  matchRepo: MatchRepository,
  tournamentRepo: TournamentRepository,
): IGameMode {
  switch (mode) {
    case 'local':
      return new LocalMode(matchRepo);
    case 'remote':
      return new RemoteMode(matchRepo);
    case 'tournament':
      return new TournamentMode(matchRepo, tournamentRepo);
    case 'ai':
      return new AiMode(matchRepo);
    default:
      throw new Error(`Unknown game mode: ${mode}`);
  }
}
