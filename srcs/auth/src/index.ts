import fastify, { FastifyReply, FastifyRequest } from 'fastify'
import fastifyCookie from '@fastify/cookie'
import fastifyJwt from '@fastify/jwt'
import { authRoutes } from './routes/auth.routes.js'
import { initAdminUser, initInviteUser } from './utils/init-users.js'
import { loggerConfig } from './config/logger.config.js'
import { EVENTS } from './utils/constants.js'
import { AppBaseError, ServiceError } from './types/errors.js'

const env = (globalThis as any).process?.env || {}
const UM_SERVICE_NAME = env['UM_SERVICE_NAME'] || 'user-service';
const UM_SERVICE_PORT = env['UM_SERVICE_PORT'] || '3002';

export const UM_SERVICE_URL = `http://${UM_SERVICE_NAME}:${UM_SERVICE_PORT}`
const app = fastify({
  logger: loggerConfig,
  disableRequestLogging: false,
})

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

app.setErrorHandler((error: AppBaseError, req, _reply) => {
  req.log.error({
    err: error, 
    event: error?.context?.event || EVENTS.EXCEPTION.UNHANDLED,
    reason: error.context?.reason,
  }, 'Request failed');
});

// Register shared plugins once
app.register(fastifyCookie)
app.register(fastifyJwt, { secret: env.JWT_SECRET || 'supersecretkey' })

app.register(authRoutes, { prefix: '/' })

app.listen({ host: '0.0.0.0', port: 3001 }, async (err: any, address: string) => {
  if (err) {
    console.error(err)
    ;(globalThis as any).process?.exit?.(1)
  }
  console.log(`Auth service listening at ${address}`)

  try {
    await initAdminUser()
    await initInviteUser()
    app.log.info({ event: EVENTS.SERVICE.READY }, '✅ Auth service is ready')
  } catch (error: any) {
    app.log.error({ event: EVENTS.SERVICE.FAIL, err: error?.message || error })
    ;(globalThis as any).process?.exit?.(1)
  }
})
