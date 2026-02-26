import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { randomUUID } from 'crypto';
import { gameSessions } from '../core/game.state.js';
import { getGame as getSessionData } from '../service/game.init.js';
import { handleClientMessage } from '../service/game.communication.js';
import { GameSettings } from '../core/game.types.js';
import { WebSocket } from 'ws';
import * as db from '../core/game.database.js';
import { LOG_REASONS, AppError } from '@transcendence/core';

// Controller - get sessionId from body
export async function gameSettings(this: FastifyInstance, req: FastifyRequest) {
  const body = req.body as {
    sessionId?: string;
    settings?: GameSettings;
  };

  // ✅ Get sessionId from body
  const sessionId = body.sessionId;
  const settings = body.settings;

  // Validate sessionId
  if (!sessionId) {
    this.log.warn({ body }, 'Missing sessionId in request body');
    return {
      status: 'failure',
      message: 'sessionId is required in request body',
    };
  }

  // Validate settings
  if (!settings) {
    this.log.warn({ sessionId, body }, 'Missing settings in request body');
    return {
      status: 'failure',
      message: 'settings are required in request body',
    };
  }

  // Get session
  const sessionData = gameSessions.get(sessionId);
  if (!sessionData) {
    this.log.warn({ sessionId }, 'Session not found');
    return {
      status: 'failure',
      message: `Session ${sessionId} not found`,
    };
  }

  if (sessionData.game.status != 'waiting') {
    this.log.warn({ sessionId }, 'Session is running or finished');
    return {
      status: 'failure',
      message: `game session cannot be changed (certainly running)`,
    };
  }
  // Apply settings
  sessionData.game.applySettings(settings as GameSettings);
  this.log.info({ sessionId, settings }, 'Game settings applied successfully');

  return {
    status: 'success',
    message: 'Settings applied',
    sessionId: sessionId,
    appliedSettings: sessionData.game.getSettings(),
  };
}

export async function newGameSession(this: FastifyInstance) {
  const sessionId = randomUUID();
  const sessionData = getSessionData.call(this, null, sessionId);
  if (sessionData.game) sessionData.game.preview();
  return {
    status: 'success',
    message: 'Game session created',
    sessionId: sessionId,
    wsUrl: `/game/${sessionId}`,
  };
}

export async function healthCheck() {
  return {
    status: 'healthy',
    service: 'websocket-game-service',
    activeSessions: gameSessions.size,
    timestamp: new Date().toISOString(),
  };
}

export async function listGameSessions() {
  const sessions = Array.from(gameSessions.entries()).map(([id, sessionData]) => ({
    sessionId: id,
    state: sessionData.game.getState(),
    playerCount: sessionData.players.size,
    hasInterval: sessionData.interval !== null,
  }));

  return {
    status: 'success',
    count: sessions.length,
    sessions,
  };
}

export async function webSocketConnect(
  this: FastifyInstance,
  socket: WebSocket,
  req: FastifyRequest,
) {
  console.log('get to the sessions id by WS');
  const params = req.params as { sessionId: string };
  const sessionId = params.sessionId;

  // const sessionData = getSessionData.call(this, null, sessionId);
  // if (sessionData && sessionData.player.size === 2) {
  //  socket.close(WS_CLOSE.SESSION_FULL, 'Game session is full');
  //  return
  // }
  handleClientMessage.call(this, socket, sessionId);
}

export async function newTournament(req: FastifyRequest, reply: FastifyReply) {
  const idHeader = (req.headers as any)['x-user-id'];
  const userId = idHeader ? Number(idHeader) : null;
  if (!userId)
    return reply.code(500).send({ code: 'NOT_VALID_USER', message: "This user don't exist" });
  const userExist = db.getUser(userId);
  if (!userExist)
    return reply.code(500).send({ code: 'NOT_VALID_USER', message: "This user don't exist" });
  const tournament_id = db.createTournament(userId);
  return reply.code(200).send(tournament_id);
}

export async function listTournament(req: FastifyRequest, reply: FastifyReply) {
  const tournaments = db.listTournaments();
  return reply.code(200).send(tournaments);
}

interface TournamentParams {
  id: string;
}

export async function joinTournament(
  req: FastifyRequest<{ Params: TournamentParams }>,
  reply: FastifyReply,
) {
  const tourId = Number(req.params.id);
  const idHeader = (req.headers as any)['x-user-id'];
  const userId = idHeader ? Number(idHeader) : null;
  if (!userId)
    return reply.code(500).send({ code: 'NOT_VALID_USER', message: "This user don't exist" });
  try {
    db.joinTournament(userId, tourId);
  } catch (err: unknown) {
    if (err instanceof AppError) {
      const isTournamentFull = err.context?.details?.some(
        (d: any) => d.reason === 'tournament_full',
      );
      if (isTournamentFull) return reply.code(409).send({ message: err.message });
    } else {
      throw err;
    }
  }
  return reply.code(200).send({ joining: tourId });
}

// RL API: Reset game session
export async function resetGame(this: FastifyInstance, req: FastifyRequest) {
  const body = req.body as { sessionId?: string };
  const sessionId = body.sessionId;
  if (!sessionId) {
    return { status: 'failure', message: 'sessionId is required' };
  }
  const sessionData = gameSessions.get(sessionId);
  if (!sessionData) {
    return { status: 'failure', message: `Session ${sessionId} not found` };
  }
  sessionData.game.scores.left = 0;
  sessionData.game.scores.right = 0;
  sessionData.game.status = 'waiting';
  sessionData.game.resetBall();
  return { status: 'success', state: sessionData.game.getState() };
}

// RL API: Step (apply action)
export async function stepGame(this: FastifyInstance, req: FastifyRequest) {
  const body = req.body as {
    sessionId?: string;
    action?: 'up' | 'down' | 'stop';
    paddle?: 'left' | 'right';
  };
  const sessionId = body.sessionId;
  const action = body.action;
  const paddle = body.paddle || 'right';
  if (!sessionId || !action) {
    return { status: 'failure', message: 'sessionId and action are required' };
  }
  const sessionData = gameSessions.get(sessionId);
  if (!sessionData) {
    return { status: 'failure', message: `Session ${sessionId} not found` };
  }
  sessionData.game.setPaddleDirection(paddle, action);
  sessionData.game.update();
  let reward = 0;
  let done = false;
  if (sessionData.game.status === 'finished') {
    done = true;
    reward = sessionData.game.scores.right > sessionData.game.scores.left ? 1 : -1;
  }
  return {
    status: 'success',
    state: sessionData.game.getState(),
    reward,
    done,
  };
}

// RL API: Get current state
export async function getGameState(this: FastifyInstance, req: FastifyRequest) {
  const sessionId =
    (req.query as { sessionId?: string }).sessionId ||
    (req.body as { sessionId?: string }).sessionId;
  if (!sessionId) {
    return { status: 'failure', message: 'sessionId is required' };
  }
  const sessionData = gameSessions.get(sessionId);
  if (!sessionData) {
    return { status: 'failure', message: `Session ${sessionId} not found` };
  }
  return { status: 'success', state: sessionData.game.getState() };
}

export async function showTournament(
  req: FastifyRequest<{ Params: TournamentParams }>,
  reply: FastifyReply,
) {
  const tourId = Number(req.params.id);
  const result = db.showTournament(tourId);
  if (result.length === 0) return reply.code(404).send(`tournament don't exist`);
  return reply.code(200).send(result);
}
