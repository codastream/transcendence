import {
  ProfileSimpleDTO,
  ProfileWithAuthDTO,
  UserDTO,
  usernameDTO,
  usernameSchema,
} from '@transcendence/core';
import api from './api-client';

export const profileApi = {
  getMe: async (currentUsername: usernameDTO): Promise<ProfileWithAuthDTO> => {
    const [authRes, profileRes] = await Promise.all([
      api.get(`/auth/me`) as Promise<{ data: { user: UserDTO } }>,
      api.get(`/users/username/${currentUsername}`) as Promise<{ data: ProfileSimpleDTO }>,
    ]);

    const profile = profileRes.data;
    const authUser = authRes.data.user;
    console.log(authRes);
    console.log(profileRes);

    const fullProfile = {
      username: profile.username,
      avatarUrl: profile.avatarUrl,
      id: authUser.id,
      email: authUser.email,
    };
    console.log(fullProfile);
    return fullProfile;
  },

  getProfileByUsername: async (username: usernameDTO): Promise<ProfileSimpleDTO> => {
    usernameSchema.parse(username);
    const { data } = await api.get(`/users/username/${username}`);
    return { ...data };
  },

  getLike: async (query: string): Promise<ProfileSimpleDTO[]> => {
    const { data } = await api.get(`/users`, { params: { query } });
    return data;
  },

  updateUsername: async (
    username: usernameDTO,
    newUsername: usernameDTO,
  ): Promise<ProfileSimpleDTO> => {
    const { data } = await api.patch(`/users/${username}/username`, { newUsername });
    return { ...data };
  },

  updateAvatar: async (
    username: usernameDTO,
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<ProfileSimpleDTO> => {
    usernameSchema.parse(username);

    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.patch(`/users/${username}/avatar`, formData, {
      // headers: { 'Content-Type': 'multipart/form-data' }, // cela empeche le navigateur de gérer le boundary car Axios le supprime
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });

    return { ...data };
  },

  deleteProfile: async (username: usernameDTO): Promise<ProfileSimpleDTO> => {
    usernameSchema.parse(username);
    const { data } = await api.delete(`/users/username/${username}`);
    return { ...data };
  },
};
