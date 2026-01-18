import { ProfileAuthDTO, ProfileDTO, usernameDTO, usernameSchema } from '@transcendence/core';
import api from './api-client';
import { authApi } from './auth-api';

export const profileApi = {
  getProfileByUsername: async (username: usernameDTO): Promise<ProfileDTO> => {
    usernameSchema.parse(username);
    const { data } = await api.get(`/users/username/${username}`);
    return { ...data };
  },

  updateAvatar: async (
    username: usernameDTO,
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<ProfileDTO> => {
    usernameSchema.parse(username);

    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.patch(`/users/username/${username}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });

    return { ...data };
  },

  deleteProfile: async (username: usernameDTO): Promise<ProfileDTO> => {
    usernameSchema.parse(username);
    const { data } = await api.delete(`/users/username/${username}`);
    return { ...data };
  },

  // to use to retrieve all user info (excepted id and role) (from auth + users) in one call
  getProfileAuthByUsername: async (username: usernameDTO): Promise<ProfileAuthDTO> => {
    usernameSchema.parse(username);

    const [authRes, profileRes] = await Promise.all([
      authApi.me(username),
      profileApi.getProfileByUsername(username),
    ]);
    return {
      ...profileRes,
      email: authRes.email,
    };
  },
};
