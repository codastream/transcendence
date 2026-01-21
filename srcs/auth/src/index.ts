import fastify, { FastifyReply, FastifyRequest } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyJwt from '@fastify/jwt';
import fastifyRateLimit, { errorResponseBuilderContext } from '@fastify/rate-limit';
import { authRoutes } from './routes/auth.routes.js';
import { adminRoutes } from './routes/admin.routes.js';
import { initAdminUser, initInviteUser } from './utils/init-users.js';
import * as totpService from './services/totp.service.js';
import * as onlineService from './services/online.service.js';
import { loggerConfig } from './config/logger.config.js';
import { AUTH_CONFIG, ERROR_CODES, EVENTS, REASONS } from './utils/constants.js';
import { AppBaseError } from './types/errors.js';
import { authenv } from './config/env.js';

const app = fastify({
  logger: loggerConfig,
  disableRequestLogging: false,
});

export const logger = app.log;

/**
 * @abstract add userId and userName to logger
 */
app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
  const userId = request.headers['x-user-id'];
  const userName = request.headers['x-user-name'];
  const bindings: Record<string, any> = {};
  if (userId) {
    bindings.userId = Number(userId) || userId;
  }
  if (userName) {
    bindings.username = userName;
  }
  if (Object.keys(bindings).length > 0) {
    request.log = request.log.child(bindings);
  }
});

app.setErrorHandler((error: AppBaseError, req, reply) => {
  // Ne pas traiter les erreurs déjà envoyées
  if (reply.sent) {
    req.log.debug({
      event: 'error_handler_skipped_reply_sent',
      method: req.method,
      url: req.url,
      errorCode: (error as any)?.code,
      errorMessage: (error as any)?.message,
    });
    return;
  }

  // Gestion spéciale pour les erreurs de rate limiting
  const statusCode = (error as any)?.statusCode || 500;
  if (
    statusCode === 429 ||
    (error as any).code === 'FST_ERR_RATE_LIMITED' ||
    (error as any).code === 'FST_ERR_RATE_LIMIT' ||
    (error as any).message?.includes('Rate limit exceeded')
  ) {
    req.log.warn({
      event: 'rate_limit_handled_in_error_handler',
      ip: req.ip,
      url: req.url,
      method: req.method,
      errorCode: (error as any).code,
      errorMessage: (error as any).message,
      statusCode: statusCode,
    });

    // Envoi de la réponse et stop
    reply.code(429).send({
      error: {
        message: 'Too many requests, please try again later',
        code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        retryAfter: '60s',
      },
    });
    return; // Important : arrêter le traitement ici
  }

  req.log.error(
    {
      err: error,
      event: error?.context?.event || EVENTS.CRITICAL.BUG,
      reason: error?.context?.reason || REASONS.UNKNOWN,
      statusCode: statusCode,
      errorCode: (error as any)?.code,
      errorName: (error as any)?.name,
    },
    'Error',
  );

  reply.code(statusCode).send({
    error: {
      message: (error as any)?.message || 'Internal server error',
      code: (error as any)?.code || EVENTS.CRITICAL.BUG,
      reason: error?.context?.reason || REASONS.UNKNOWN,
    },
  });
});

// Register shared plugins once
app.register(fastifyCookie);
app.register(fastifyJwt, { secret: authenv.JWT_SECRET });

// Rate limiting - désactivé en mode test/développement pour éviter les erreurs 500
const isTestOrDev = authenv.NODE_ENV === 'test' || authenv.NODE_ENV === 'development';

if (isTestOrDev) {
  logger.info({
    event: 'rate_limit_disabled',
    environment: authenv.NODE_ENV,
    reason: 'test_environment',
  });
} else {
  // Rate limiting uniquement en production
  logger.info({
    event: 'rate_limit_enabled',
    environment: authenv.NODE_ENV,
    max: AUTH_CONFIG.RATE_LIMIT.GLOBAL.max,
    timeWindow: AUTH_CONFIG.RATE_LIMIT.GLOBAL.timeWindow,
  });

  app.register(fastifyRateLimit, {
    max: AUTH_CONFIG.RATE_LIMIT.GLOBAL.max,
    timeWindow: AUTH_CONFIG.RATE_LIMIT.GLOBAL.timeWindow,
    errorResponseBuilder: (_req: FastifyRequest, context: errorResponseBuilderContext) => {
      logger.warn({
        event: 'rate_limit_response_sent',
        ip: _req.ip,
        url: _req.url,
        method: _req.method,
        retryAfter: context.after,
      });

      return {
        error: {
          message: 'Too many requests, please try again later',
          code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
          retryAfter: context.after,
        },
      };
    },
  });
}

app.register(authRoutes, { prefix: '/' });
app.register(adminRoutes, { prefix: '/admin' });

(async () => {
  try {
    const address = await app.listen({ host: '0.0.0.0', port: authenv.AUTH_SERVICE_PORT });
    console.log(`Auth service listening at ${address}`);

    await initAdminUser();
    await initInviteUser();

    // Initialiser le client Redis pour les statuts en ligne
    onlineService.initRedisClient();

    // Nettoyer les sessions expirées au démarrage
    totpService.cleanupExpiredSessions();

    // Maintenance automatique toutes les 5 minutes
    setInterval(() => {
      totpService.cleanupExpiredSessions();
    }, AUTH_CONFIG.CLEANUP_INTERVAL_MS);

    // Démarrer le job de nettoyage des statuts en ligne (toutes les 60 secondes)
    onlineService.startCleanupJob(60000);

    logger.info({
      event: 'service_ready',
      message: 'Auth service is ready',
      cleanupInterval: `${AUTH_CONFIG.CLEANUP_INTERVAL_MS / 1000}s`,
    });
  } catch (error: any) {
    logger.error({ event: 'service_startup_failed', err: error?.message || error });
    console.error(error);
    (globalThis as any).process?.exit?.(1);
  }
})();
