import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { blockIdSchema, blockSchema } from './block.schema.js'
import { addMatch, addMatchForm, getMatchView, listMatch, listMatchView } from './block.controller.js'

export async function registerRoutes(app: FastifyInstance) {
  app.register(healthRoutes, { prefix: '/health' })
  app.register(blockRoutes)
}

async function blockRoutes(app: FastifyInstance) {
  app.get("/", listMatchView);
  app.get("/list", listMatch);
  app.post("/", { schema: { body: blockSchema } }, addMatchForm);
  app.post("/register", { schema: { body: blockSchema } }, addMatch);
  app.get("/row/:tx_id", { schema: { params: blockIdSchema } }, getMatchView);
}

async function healthRoutes(app: FastifyInstance) {
  app.get(
    '/',
    async function (this: FastifyInstance, _request: FastifyRequest, reply: FastifyReply) {
      return reply.code(200).send({ status: 'healthy', hotReload: 'ok fdac!' })
    },
  )
}
