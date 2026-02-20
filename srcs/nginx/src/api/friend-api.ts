import {
  FriendshipFullDTO,
  FriendshipUnifiedDTO,
  usernameDTO,
  usernameSchema,
} from '@transcendence/core';
import api from './api-client';

export const friendApi = {
  addFriend: async (friendUsername: usernameDTO): Promise<FriendshipFullDTO> => {
    usernameSchema.parse(friendUsername);
    const { data } = await api.post(`/users/friends`, {
      targetUsername: friendUsername,
    });
    return data;
  },

  getFriends: async (): Promise<FriendshipUnifiedDTO[]> => {
    const { data } = await api.get(`/users/friends`);
    return data;
  },

  removeFriend: async (friendUsername: usernameDTO): Promise<FriendshipFullDTO> => {
    usernameSchema.parse(friendUsername);
    const { data } = await api.delete(`/users/friends/${encodeURIComponent(friendUsername)}`);
    return data;
  },
};
