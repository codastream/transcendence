// as returned by controller
export interface UserProfileDTO {
  username: string
  avatarUrl: string
}

export interface FriendDTO {
  userId: number
  username: string
  avatar_url: string
  status?: string
}
