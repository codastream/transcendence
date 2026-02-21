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
} from '../controllers/game.controller.js';

export async function gameRoutes(app: FastifyInstance) {
  app.post('/settings', gameSettings);
  app.get('/sessions', listGameSessions);
  app.post('/create-session', newGameSession);
  app.get('/health', healthCheck);
  app.get('/ws/:sessionId', { websocket: true }, webSocketConnect);
  app.post('/create-tournament', { preHandler: app.authenticate }, newTournament);
  app.get('/tournaments', listTournament);
  app.post('/tournaments/:id', { preHandler: app.authenticate }, joinTournament);
  app.get('/tournaments/:id', { preHandler: app.authenticate }, showTournament);
}
