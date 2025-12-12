import { FastifyRequest, FastifyError } from 'fastify';
import { IncomingMessage } from 'node:http';
import { LoggerOptions } from 'pino';
import { hostname } from 'os';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * @abstract configure logging to facilitate future compatibility with ELK
 * @todo check if logging of all headers (except for authorization as of now) is necessary 
 */
export const loggerConfig: LoggerOptions = {
    redact: ['req.headers.authorization'],
    level: process.env.LOG_LEVEL || 'info',
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
    base: {
        env: process.env.NODE_ENV,
        service: process.env.AUTH_SERVICE_NAME || 'auth-service',
        pid: process.pid,
        hostname: hostname()
    },
    formatters: {
        level: (label) => {
            return { level: label };
        },
    },
    serializers: {
        req (request: FastifyRequest | IncomingMessage) {
            const fastifyReq = request as any;
            return {
                method: request.method,
                url: request.url,
                headers: request.headers,
                hostname: fastifyReq.hostname || request.headers?.host,
                remoteAddress: fastifyReq.ip || request.socket?.remoteAddress,
                remotePort: request.socket?.remotePort,
                traceId: fastifyReq.id,
            };
        },
        err (err: any) {
            return {
                type: err.name || err.type,
                message: err.message,
                stack: err.stack || '',
                code: err.code || err.statusCode,
            };
        }
    },
    transport: isDev ? {
        target: 'pino-pretty',
        options: {
            colorize: true, translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname'
        },
    } : undefined,
}