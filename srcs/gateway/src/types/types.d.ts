import '@fastify/jwt';
import { fastify } from 'fastify';
import { UserRequestDTO } from '@transcendence/core';
import { JWTPayload } from '../utils/jwt.service.ts';

/**
 * sub is used by JWT as number
 */
export interface UserPayload {
  sub: string | number;
  id?: string;
  role?: string;
  email?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: JWTPayload;
  }
}

declare module 'fastify' {
  interface FastifyContextConfig {
    isPublic?: boolean;
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: UserPayload;
    from: (
      url: string,
      opts?: {
        rewriteHeaders?: (
          originalReq: unknown,
          headers: Record<string, string>,
        ) => Record<string, string>;
      },
    ) => Promise<void>;
  }
}
