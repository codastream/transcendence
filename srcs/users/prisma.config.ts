import path from 'node:path';
import { appenv } from './src/config/env';

import { defineConfig } from 'prisma/config';

// const isDocker = process.env.IS_DOCKER === 'true' || path.resolve('/').startsWith('/app');

const ROOT_DIR = process.env.NODE_ENV === 'production' ? '/app' : process.cwd();

export default defineConfig({
  schema: path.join(ROOT_DIR, 'prisma', 'schema.prisma'),
  migrations: {
    path: path.join(ROOT_DIR, 'prisma', 'migrations'),
  },
  datasource: {
    url: appenv.UM_DB_URL,
  },
});
