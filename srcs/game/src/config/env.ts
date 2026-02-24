import { bool, cleanEnv, port, str } from 'envalid';

export const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ['development', 'test', 'production', 'staging'],
    default: 'development',
  }),
  LOG_ENABLED: bool({ default: true }),
  LOG_LEVEL: str({
    choices: ['debug', 'info', 'warn', 'error'],
    default: 'info',
  }),
  GAME_SERVICE_PORT: port({ default: 3003 }),
  GAME_SERVICE_NAME: str({ default: 'game-service' }),
  GAME_DB_PATH: str({ default: './data/game.db' }),
  REDIS_SERVICE_NAME: str({ default: 'redis-broker' }),
  REDIS_URL: str({
    choices: ['redis://127.0.0.1:6379', 'redis://redis-broker:6379'],
    default: '',
  }),
});
