import { FastifyReply, FastifyRequest } from 'fastify';
import { friendshipService } from '../services/friends.service.js';
import {
  FriendshipUpdateNicknameDTO,
  FriendshipUpdateStatusDTO,
  LOG_ACTIONS,
  LOG_RESOURCES,
} from '@transcendence/core';

export class FriendshipController {
  // GET /users/friends/
  async getFriendsByUserId(req: FastifyRequest, reply: FastifyReply) {
    const userId = req?.user?.id;
    req.log.info({ event: `${LOG_ACTIONS.READ}_${LOG_RESOURCES.FRIEND}`, userId });

    const friends = await friendshipService.getFriendsByUserId(userId);
    return reply.status(200).send(friends);
  }

  // POST /users/friends
  async createFriend(
    req: FastifyRequest<{ Body: { targetUsername: string } }>,
    reply: FastifyReply,
  ) {
    const { targetUsername } = req?.body;
    const userId = req.user.id;
    const username = req.user.username;
    req.log.info({
      event: `${LOG_ACTIONS.CREATE}_${LOG_RESOURCES.FRIEND}`,
      userId,
      body: req.body,
    });

    const friendship = await friendshipService.createFriend(username, userId, targetUsername);
    return reply.status(201).send(friendship);
  }

  // DELETE /users/friends/:targetusername
  async removeFriend(
    req: FastifyRequest<{ Params: { targetUsername: string } }>,
    reply: FastifyReply,
  ) {
    const { targetUsername } = req.params;
    const userId = req?.user?.id;
    req.log.info({
      event: `${LOG_ACTIONS.DELETE}_${LOG_RESOURCES.FRIEND}`,
      userId,
      param: targetUsername,
      body: req.body,
    });

    const removedFriendship = await friendshipService.removeFriend(userId, targetUsername);
    return reply.status(200).send(removedFriendship);
  }

  // PATCH /users/friends/:targetusername/status
  async updateFriendStatus(
    req: FastifyRequest<{
      Params: { targetUsername: string };
      Body: FriendshipUpdateStatusDTO;
    }>,
    reply: FastifyReply,
  ) {
    const { targetUsername } = req.params;
    const userId = req?.user?.id;
    const { status } = req?.body as FriendshipUpdateStatusDTO;
    req.log.info({
      event: `${LOG_ACTIONS.UPDATE}_${LOG_RESOURCES.FRIEND}`,
      userId,
      param: req.params,
      body: req.body,
    });

    const updatedFriendship = await friendshipService.updateFriendshipStatus(
      userId,
      targetUsername,
      status,
    );
    return reply.status(200).send(updatedFriendship);
  }

  // PATCH /users/friends/:targetusername/nickname
  async updateFriendNickname(
    req: FastifyRequest<{
      Params: { targetUsername: string };
      Body: FriendshipUpdateNicknameDTO;
    }>,
    reply: FastifyReply,
  ) {
    const { targetUsername } = req.params;
    const userId = req?.user?.id;
    const { nickname } = req?.body as FriendshipUpdateNicknameDTO;
    req.log.info({
      event: `${LOG_ACTIONS.UPDATE}_${LOG_RESOURCES.FRIEND}`,
      userId,
      param: req.params,
      body: req.body,
    });

    const updatedFriendship = await friendshipService.updateFriendshipNickname(
      userId,
      targetUsername,
      nickname,
    );
    return reply.status(200).send(updatedFriendship);
  }
}

export const friendshipController = new FriendshipController();
