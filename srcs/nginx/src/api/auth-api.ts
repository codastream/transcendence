import {
  idDTO,
  IdSchema,
  ProfileAuthDTO,
  UserDTO,
  UserLoginDTO,
  UserLoginSchema,
  usernameDTO,
  usernameSchema,
  UserRegisterDTO,
  UserRegisterSchema,
} from '@transcendence/core';
import api from './api-client';

export const authApi = {
  register: async (payload: UserRegisterDTO): Promise<idDTO> => {
    UserRegisterSchema.parse(payload);
    const { data } = await api.post(`/auth/register`, payload);
    return data.result.id;
  },

  login: async (payload: UserLoginDTO): Promise<usernameDTO> => {
    UserLoginSchema.parse(payload);
    const { data } = await api.post(`/auth/login`, payload);
    return data.result.username;
  },

  me: async (username: usernameDTO): Promise<UserDTO> => {
    usernameSchema.parse(username);
    // const response = await api.get(`/auth/me/${username}`);
    const response = {
      data: {
        authId: 1,
        email: 'toto@mail.com',
        username: 'Toto',
      },
      message: 'OK',
    };
    return response.data;
  },
};
