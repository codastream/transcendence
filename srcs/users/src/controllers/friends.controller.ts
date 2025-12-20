import { FastifyReply, FastifyRequest } from 'fastify'
import { friendsService } from '../services/friends.service.js'
import { ValidationSchemas } from '../schemas/schemas.js'
import z from 'zod'
import { API_ERRORS, LOG_EVENTS } from '../utils/messages.js'
import { mapProfileToFriendDTO } from '../utils/mappers.js'

function handleInvalidRequest<T>(
  req: FastifyRequest,
  reply: FastifyReply,
  validation: z.ZodSafeParseError<T>
) {
  req.log.warn({ event: LOG_EVENTS.INVALID_REQUEST, request: req })
  return reply.status(400).send({
    error: API_ERRORS.USER.INVALID_FORMAT,
    details: z.treeifyError(validation.error),
  })
}

// GET /users/friends/
export async function getFriendsByUserId(
  req: FastifyRequest,
  reply: FastifyReply
) {
  // TODO: Get current user ID from auth middleware/token
  // For now, assuming it comes from query or we get it from context
  const idUser = req.query?.idUser as string || '1' // Placeholder
  const userId = parseInt(idUser, 10)
  
  req.log.info({ event: LOG_EVENTS.GET_FRIENDS, userId })

  const validation = ValidationSchemas['FriendGet'].safeParse({ idUser: userId })
  if (!validation.success) {
    return handleInvalidRequest(req, reply, validation)
  }

  try {
    const friends = await friendsService.getFriendsByUserId(userId)
    const friendDTOs = friends.map(mapProfileToFriendDTO)
    return reply.status(200).send(friendDTOs)
  } catch (error) {
    req.log.error(error)
    return reply.status(500).send({ message: API_ERRORS.UNKNOWN })
  }
}

// POST /users/friends
export async function addFriend(
  req: FastifyRequest<{
    Body: { idFriend1: number; idFriend2: number }
  }>,
  reply: FastifyReply
) {
  const { idFriend1, idFriend2 } = req.body
  req.log.info({ event: LOG_EVENTS.ADD_FRIEND, idFriend1, idFriend2 })

  const validation = ValidationSchemas['FriendAdd'].safeParse({
    idFriend1,
    idFriend2,
  })
  if (!validation.success) {
    return handleInvalidRequest(req, reply, validation)
  }

  try {
    const friendship = await friendsService.addFriend(idFriend1, idFriend2)
    return reply.status(201).send(friendship)
  } catch (error: unknown) {
    req.log.error(error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    
    if (errorMsg.includes('already exist')) {
      return reply.status(409).send({ message: API_ERRORS.USER.FRIEND.ALREADY_FRIENDS })
    }
    if (errorMsg.includes('Friend limit reached')) {
      return reply.status(400).send({ message: 'Maximum 10 friends allowed' })
    }
    return reply.status(500).send({ message: API_ERRORS.USER.FRIEND.ADD_FAILED })
  }
}

// DELETE /users/friends/:idRelation
export async function removeFriend(
  req: FastifyRequest<{ Params: { idRelation: string } }>,
  reply: FastifyReply
) {
  const idRelation = parseInt(req.params.idRelation, 10)
  req.log.info({ event: LOG_EVENTS.REMOVE_FRIEND, idRelation })

  const validation = ValidationSchemas['FriendDelete'].safeParse({ idRelation })
  if (!validation.success) {
    return handleInvalidRequest(req, reply, validation)
  }

  try {
    const result = await friendsService.removeFriend(idRelation)
    if (!result) {
      return reply.status(404).send({ message: API_ERRORS.USER.FRIEND.NOT_FRIENDS })
    }
    return reply.status(200).send({ message: 'Friend removed successfully' })
  } catch (error) {
    req.log.error(error)
    return reply.status(500).send({ message: API_ERRORS.USER.FRIEND.DELETE_FAILED })
  }
}