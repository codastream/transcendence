import { UserProfile } from '@prisma/client';
import {
  FriendshipFullDTO,
  FriendshipUnifiedDTO,
  ProfileSimpleDTO,
  ProfileDTO,
} from '@transcendence/core';

export function mapProfileToDTO(profile: UserProfile): ProfileSimpleDTO {
  return {
    username: profile.username,
    avatarUrl: profile.avatarUrl,
  };
}

export function mapProfileToIdDTO(profile: UserProfile): ProfileDTO {
  return {
    username: profile.username,
    avatarUrl: profile.avatarUrl,
    authId: profile.authId,
  };
}

export function mapFriendshipToDTO(
  f: FriendshipFullDTO,
  currentUserId: number,
): FriendshipUnifiedDTO {
  const friendProfile = f.receiver.authId === currentUserId ? f.requester : f.receiver;
  const nickname = f.receiver.authId === currentUserId ? f.nicknameRequester : f.nicknameReceiver;
  return {
    id: f.id,
    status: f.status,
    nickname: nickname,
    friend: friendProfile,
  };
}
