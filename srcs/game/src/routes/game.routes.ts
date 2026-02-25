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
} from '../controllers/game.controller.js';

export async function gameRoutes(app: FastifyInstance) {
  app.post('/settings', gameSettings);
  app.get('/sessions', listGameSessions);
  app.post('/create-session', newGameSession);
  app.get('/health', healthCheck);
  app.post('/create-tournament', newTournament);
  app.get('/tournaments', listTournament);
  app.post('/tournaments/:id', joinTournament);
  app.get('/tournaments/:id', showTournament);
  app.delete('/del/:sessionId', deleteSession);
  app.get('/ws/:sessionId', { websocket: true }, webSocketConnect);
}
