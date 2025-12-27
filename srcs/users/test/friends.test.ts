import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import fastify from 'fastify';
vi.mock('../src/services/friends.service.js');

import { umRoutes } from '../src/routes/um.routes.js';
import * as friendsService from '../src/services/friends.service.js';

describe('Friends API', () => {
  const app = fastify();

  beforeAll(async () => {
    app.addHook('preHandler', async (req) => {
      const userId = req.headers['x-user-id'];
      const role = req.headers['x-user-role'];
      if (userId) {
        (req as any).user = {
          id: parseInt(userId as string, 10),
          role: role || 'user',
        };
      }
    });

    app.register(umRoutes);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const mockFriendship = {
    id: 1,
    userId: 1,
    friendId: 2,
    createdAt: new Date(),
  };

  describe('POST /users/friends', () => {
    test('Should add friend successfully - 201', async () => {
      vi.spyOn(friendsService, 'addFriend').mockResolvedValue(mockFriendship as any);

      const response = await app.inject({
        method: 'POST',
        url: '/users/friends',
        headers: { 'x-user-id': '1' },
        payload: { targetId: 2 },
      });

      expect(friendsService.addFriend).toHaveBeenCalledWith(1, 2);
      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.payload)).toEqual({
        relationId: 1,
        user1Id: 1,
        user2Id: 2,
      });
    });

    test('Should return 401 if userId is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/users/friends',
        payload: { targetId: 2 },
      });

      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.payload)).toEqual({
        message: 'Unauthorized',
      });
    });

    test('Should return 400 if userId equals targetId', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/users/friends',
        headers: { 'x-user-id': '1' },
        payload: { targetId: 1 },
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.payload)).toEqual({
        message: 'Cannot add yourself as friend',
      });
    });

    test('Should return 400 if users do not exist', async () => {
      vi.spyOn(friendsService, 'addFriend').mockRejectedValue(
        new Error('One or both users do not exist'),
      );

      const response = await app.inject({
        method: 'POST',
        url: '/users/friends',
        headers: { 'x-user-id': '1' },
        payload: { targetId: 999 },
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.payload).message).toContain('do not exist');
    });

    test('Should return 409 if already friends', async () => {
      vi.spyOn(friendsService, 'addFriend').mockRejectedValue(
        new Error('Friendship already exists'),
      );

      const response = await app.inject({
        method: 'POST',
        url: '/users/friends',
        headers: { 'x-user-id': '1' },
        payload: { targetId: 2 },
      });

      expect(response.statusCode).toBe(409);
    });

    test('Should return 400 for invalid targetId', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/users/friends',
        headers: { 'x-user-id': '1' },
        payload: { targetId: -1 },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('DELETE /users/friends/:targetId', () => {
    test('Should delete own friendship - 200', async () => {
      vi.spyOn(friendsService, 'removeFriend').mockResolvedValue(mockFriendship as any);

      const response = await app.inject({
        method: 'DELETE',
        url: '/users/friends/2',
        headers: { 'x-user-id': '1' },
      });

      expect(friendsService.removeFriend).toHaveBeenCalledWith(1, 2);
      expect(response.statusCode).toBe(200);
    });

    test('Should return 404 if not friends with target', async () => {
      vi.spyOn(friendsService, 'removeFriend').mockResolvedValue(null);

      const response = await app.inject({
        method: 'DELETE',
        url: '/users/friends/3',
        headers: { 'x-user-id': '1' },
      });

      expect(response.statusCode).toBe(404);
    });

    test('Should allow admin to delete any friendship', async () => {
      vi.spyOn(friendsService, 'removeFriend').mockResolvedValue(mockFriendship as any);

      const response = await app.inject({
        method: 'DELETE',
        url: '/users/friends/2',
        headers: { 'x-user-id': '1', 'x-user-role': 'admin' },
      });

      expect(response.statusCode).toBe(200);
    });

    test('Should return 404 if friendship not found', async () => {
      vi.spyOn(friendsService, 'removeFriend').mockResolvedValue(null);

      const response = await app.inject({
        method: 'DELETE',
        url: '/users/friends/2',
        headers: { 'x-user-id': '1' },
      });

      expect(response.statusCode).toBe(404);
    });

    test('Should return 401 if userId is missing', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/users/friends/2',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /users/friends/', () => {
    test('Should return friends list - 200', async () => {
      vi.spyOn(friendsService, 'getFriendsByUserId').mockResolvedValue([mockFriendship] as any);

      const response = await app.inject({
        method: 'GET',
        url: '/users/friends/',
        headers: { 'x-user-id': '1' },
      });

      expect(response.statusCode).toBe(200);
    });

    test('Should return 404 if no friends found', async () => {
      vi.spyOn(friendsService, 'getFriendsByUserId').mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/users/friends/',
        headers: { 'x-user-id': '1' },
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.payload).message).toContain('no friends');
    });
  });

  describe('PUT /users/friends/:targetId', () => {
    test('Should update friend nickname - 200', async () => {
      const updatedFriendship = { ...mockFriendship };
      vi.spyOn(friendsService, 'updateFriend').mockResolvedValue(updatedFriendship as any);

      const response = await app.inject({
        method: 'PUT',
        url: '/users/friends/2',
        headers: { 'x-user-id': '1' },
        payload: { nickname: 'MyBuddy' },
      });

      expect(friendsService.updateFriend).toHaveBeenCalledWith(1, 2, 'MyBuddy');
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload).relationId).toBe(1);
    });

    test('Should return 404 if friendship not found', async () => {
      vi.spyOn(friendsService, 'updateFriend').mockResolvedValue(null);

      const response = await app.inject({
        method: 'PUT',
        url: '/users/friends/2',
        headers: { 'x-user-id': '1' },
        payload: { nickname: 'MyBuddy' },
      });

      expect(response.statusCode).toBe(404);
    });

    test('Should return 401 if userId is missing', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/users/friends/2',
        payload: { nickname: 'MyBuddy' },
      });

      expect(response.statusCode).toBe(401);
    });

    test('Should return 400 for invalid nickname', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/users/friends/2',
        headers: { 'x-user-id': '1' },
        payload: { nickname: 'a'.repeat(51) },
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
