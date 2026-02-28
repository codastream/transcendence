import '@fastify/jwt';
import { fastify } from 'fastify';
import { UserRequestDTO } from '@transcendence/core';

/**
 * sub is used by JWT as number
 */
export interface UserPayload {
  username: string;
  id: number;
  role?: string;
  email?: string;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: UserPayload; // token as decoded
    user: UserRequestDTO; // mapped user for request
  }
}

declare module 'fastify' {
  interface FastifyContextConfig {
    isPublic?: boolean;
  }
}

declare module 'fastify' {
  interface FastifyRequest {
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
