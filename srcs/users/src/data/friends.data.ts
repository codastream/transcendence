import { Friendship } from '@prisma/client';
import { prisma } from './prisma.js';

export async function createFriendship(userId: number, friendId: number, nickname?: string): Promise<Friendship> {
  return await prisma.friendship.create({
    data: { userId, friendId, nickname: nickname === undefined ? null : nickname },
  });
}


export async function getFriendshipsByUserId(userId: number): Promise<Friendship[]> {
  return await prisma.friendship.findMany({
    where: {
      OR: [{ userId }, { friendId: userId }],
    },
  });
}

export async function updateFriendshipNickname(userId: number, friendId: number, nickname: string): Promise<Friendship | null> {
  return await prisma.friendship.update({
    where: { userId_friendId: { userId, friendId } },
    data: { nickname },
  });
}

export async function deleteFriendship(userId: number, friendId: number): Promise<Friendship | null> {
  return await prisma.friendship.delete({
    where: { userId_friendId: { userId, friendId } },
  });
}