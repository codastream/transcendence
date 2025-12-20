import { UserProfile } from "src/data/generated/prisma/client";
import { UserProfileDTO, FriendDTO } from "src/types/user-profile";

export function mapProfileToDTO(profile: UserProfile): UserProfileDTO {
    return {
        username: profile.username,
        avatarUrl: profile.avatarUrl
    }
}

export function mapProfileToFriendDTO(profile: UserProfile): FriendDTO {
    return {
        userId: profile.id,
        username: profile.username,
        avatar_url: profile.avatarUrl
    }
}