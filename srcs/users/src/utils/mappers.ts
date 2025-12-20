import type { UserProfile } from "@prisma/client";
import type { UserProfileDTO } from "../types/user-profile.js";

export function mapProfileToDTO(profile: UserProfile): UserProfileDTO {
    return {
        username: profile.username,
        avatarUrl: profile.avatarUrl
    }
}