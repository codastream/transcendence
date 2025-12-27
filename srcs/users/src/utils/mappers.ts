import { UserProfile, Friendship } from '@prisma/client';
import { UserProfileDTO, FriendDTO } from '../types/user-profile.js';

export function mapProfileToDTO(profile: UserProfile): UserProfileDTO {
  return {
    username: profile.username,
    avatarUrl: profile.avatarUrl,
  };
}

export function mapFriendshipToDTO(friendship: Friendship, currentUserId: number): FriendDTO {
  const friendUserId =
    friendship.userId === currentUserId ? friendship.friendId : friendship.userId;

  return {
    userId: friendUserId,
    username: '',
    avatar_url: '',
    nickname: '',
  };
}

export function mapProfileToFriendDTO(profile: UserProfile): FriendDTO {
  return {
    userId: profile.id,
    username: profile.username,
    avatar_url: profile.avatarUrl,
    nickname: '',
  };
}
