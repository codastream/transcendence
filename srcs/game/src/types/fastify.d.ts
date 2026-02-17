import 'fastify';
import '@fastify/jwt';
import { Redis } from 'ioredis';

// Type for authenticate plugin and JWT data
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    redis: Redis;
    closing: boolean;
  }
}
declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      sub: number;
      username: string;
      role: string;
      iat?: number;
      exp?: number;
    };
  }
}
