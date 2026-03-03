export const mockProfileDTO = {
  username: 'toto',
  avatarUrl: null,
};

export const mockProfileDTO2 = {
  username: 'tata',
  avatarUrl: null,
};

export const mockProfile = {
  username: 'toto',
  avatarUrl: '/uploads/avatar-toto.png',
};

export const mockUserProfile = {
  id: 1,
  authId: 1,
  createdAt: new Date(),
  email: 'toto@mail.com',
  username: 'toto',
  avatarUrl: null,
};

export const mockUserProfile2 = {
  id: 1,
  authId: 1,
  createdAt: new Date(),
  email: 'toto@mail.com',
  username: 'toto',
  avatarUrl: null,
};

export const mockFullProfileDTO1 = {
  username: 'toto',
  avatarUrl: null,
  authId: 1,
};

export const createPayload = {
  authId: 1,
  username: mockUserProfile.username,
  email: mockUserProfile.email,
};

export const mockProfileCreateIn = {
  authId: mockUserProfile.authId,
  email: mockUserProfile.email,
  username: mockUserProfile.username,
};

export const mockProfileCreateInIncomplete = {
  email: mockUserProfile.email,
  username: mockUserProfile.username,
};

export const mockFullProfileDTO2 = {
  username: 'tata',
  avatarUrl: null,
  authId: 2,
};

export const mockProfileDTOUpdatedAvatar = {
  username: 'toto',
  avatarUrl: 'uploads/avatar-toto-1519129853500.jpg',
};
