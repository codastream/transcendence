import { FastifyInstance } from 'fastify';
import {
  listGameSessions,
  webSocketConnect,
  newGameSession,
  healthCheck,
  gameSettings,
  newTournament,
  listTournament,
  joinTournament,
  showTournament,
  deleteSession,
  getMatchToPlay,
  getTournamentStats,
  getMatchHistory,
} from '../controllers/game.controller.js';

export async function gameRoutes(app: FastifyInstance) {
  app.post('/settings', gameSettings);
  app.get('/sessions', listGameSessions);
  app.post('/create-session', { preHandler: app.recoveryHeaders }, newGameSession);
  app.get('/health', healthCheck);
  app.post('/create-tournament', { preHandler: app.recoveryHeaders }, newTournament);
  app.get('/tournaments', { preHandler: app.recoveryHeaders }, listTournament);
  app.post<{ Params: TournamentParams }>(
    '/tournaments/:id',
    { preHandler: app.recoveryHeaders },
    joinTournament,
  );
  app.get<{ Params: TournamentParams }>(
    '/tournaments/:id',
    { preHandler: app.recoveryHeaders },
    showTournament,
  );
  app.get<{ Params: TournamentParams }>(
    '/tournaments/:id/match-to-play',
    { preHandler: app.recoveryHeaders },
    getMatchToPlay,
  );
  app.delete('/del/:sessionId', deleteSession);
  app.get('/ws/:sessionId', { websocket: true }, webSocketConnect);
  app.get('/stats', getTournamentStats);
  app.get('/history', getMatchHistory);
}
