import fastify from 'fastify';
import { umRoutes as userRoutes } from './routes/um.routes.js';
import { appenv } from './config/env.js';
import { loggerConfig } from './config/logger.config.js';

const app = fastify({
  logger: loggerConfig,
  disableRequestLogging: false,
});

export const logger = app.log;

app.addHook('preHandler', async (req) => {
  const userId = req.headers['x-user-id'];
  const role = req.headers['x-user-role'];
  if (userId) {
    (req as any).user = {
      id: parseInt(userId as string, 10),
      role: role || 'user',
    };
  }
});

app.register(userRoutes, { prefix: '/' });

app.listen(
  { host: '0.0.0.0', port: appenv.UM_SERVICE_PORT },
  (err: Error | null, address: string) => {
    if (err) {
      app.log.error({ message: err.message });
      process.exit(1);
    }
    app.log.info({ message: `User Management service listening at ${address}` });
  },
);
