import { prisma } from '../prisma/client'

export async function addFriend(userId: number, friendId: number) {

  const userExists = await prisma.userProfile.findUnique({ where: { id: userId } })
  const friendExists = await prisma.userProfile.findUnique({ where: { id: friendId } })

  if (!userExists || !friendExists) {
    throw new Error('One or both users do not exist')
  }

  const existingFriendship = await prisma.friendship.findUnique({
    where: { userId_friendId: { userId, friendId } },
  })

  if (existingFriendship) {
    throw new Error('Friendship already exists')
  }

  const friendCount = await prisma.friendship.count({
    where: { userId },
  })

  if (friendCount >= 10) {
    throw new Error('Friend limit reached')
  }

  return await prisma.friendship.create({
    data: { userId, friendId },
  })
}

export async function getFriendsByUserId(userId: number) {
  
