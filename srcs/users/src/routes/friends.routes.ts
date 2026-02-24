import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { friendshipController } from '../controllers/friends.controller.js';
import {
  FriendshipFullSchema,
  SimpleErrorWithMessageSchema,
  ValidationErrorSchema,
  FriendshipUnifiedSchema,
  FriendshipUpdateStatusSchema,
  DetailedErrorSchema,
  FriendshipUpdateNicknameSchema,
  usernameSchema,
} from '@transcendence/core';
import z from 'zod';

export const getFriendsByUserIdSchema = {
  tags: ['friends'],
  summary: "Get a user's friends",
  description: 'Returns all friends for the given user id',
  response: {
    200: z.array(FriendshipUnifiedSchema),
    400: ValidationErrorSchema,
  },
} as const;

export const createFriendSchema = {
  tags: ['friends'],
  summary: 'Create a friend',
  description:
    'Register a new friendship associating current user as requester and target user as receiver',
  body: z.object({ targetUsername: usernameSchema }),
  response: {
    201: FriendshipFullSchema,
    400: ValidationErrorSchema,
    409: DetailedErrorSchema.describe('Users are already friends'),
    422: SimpleErrorWithMessageSchema.describe('You cannot add yourself as a friend'),
  },
} as const;

export const removeFriendSchema = {
  tags: ['friends'],
  summary: 'Remove a friend',
  description:
    'Remove a friendship associating current user and an user identified by target username',
  params: z.object({
    targetUsername: usernameSchema,
  }),
  response: {
    200: FriendshipFullSchema,
    400: ValidationErrorSchema,
    404: DetailedErrorSchema.describe('Users are not friends'),
  },
} as const;

export const updateFriendStatusSchema = {
  tags: ['friends'],
  summary: 'Update friendship status',
  description:
    'Update friendship status between current user and an user identified by target username',
  params: z.object({
    targetUsername: usernameSchema,
  }),
  body: FriendshipUpdateStatusSchema,
  response: {
    200: FriendshipFullSchema,
    400: ValidationErrorSchema,
    404: DetailedErrorSchema.describe('Users are not friends'),
  },
} as const;

export const updateFriendNicknameSchema = {
  tags: ['friends'],
  summary: 'Update friend nickname',
  description: 'Update nickname given by current user to an user identified by target username',
  params: z.object({
    targetUsername: usernameSchema,
  }),
  body: FriendshipUpdateNicknameSchema,
  response: {
    200: FriendshipFullSchema,
    400: ValidationErrorSchema,
    404: DetailedErrorSchema.describe('Users are not friends'),
  },
} as const;

export const friendsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get('', { schema: getFriendsByUserIdSchema }, friendshipController.getFriendsByUserId);
  app.post('', { schema: createFriendSchema }, friendshipController.createFriend);
  app.delete('/:targetUsername', { schema: removeFriendSchema }, friendshipController.removeFriend);
  app.patch(
    '/:targetUsername/status',
    { schema: updateFriendStatusSchema },
    friendshipController.updateFriendStatus,
  );
  app.patch(
    '/:targetUsername/nickname',
    { schema: updateFriendNicknameSchema },
    friendshipController.updateFriendNickname,
  );
};
