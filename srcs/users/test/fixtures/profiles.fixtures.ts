export const mockUserProfile = {
  id: 1,
  authId: 1,
  createdAt: new Date(),
  email: 'toto@mail.com',
  username: 'toto',
  avatarUrl: null,
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

export const mockProfileDTO = {
  username: 'toto',
  avatarUrl: null,
};

export const mockProfileDTO2 = {
  username: 'tata',
  avatarUrl: null,
};

export const mockFullProfileDTO1 = {
  username: 'toto',
  avatarUrl: null,
  authId: 1,
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

export const mockProfile = {
  username: 'toto',
  avatarUrl: '/uploads/avatar-toto.png',
};

export const createPayload = {
  authId: mockUserProfile.authId,
  username: mockUserProfile.username,
  email: 'toto@mail.com',
};
