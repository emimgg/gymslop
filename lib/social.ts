import { prisma } from './prisma';
import { type NotificationType } from '@prisma/client';

export async function createNotification(
  userId: string,
  type: NotificationType,
  message: string,
  link?: string,
) {
  return prisma.notification.create({ data: { userId, type, message, link } });
}

/** Returns accepted friend IDs for a user */
export async function getFriendIds(userId: string): Promise<string[]> {
  const rows = await prisma.friendship.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    select: { senderId: true, receiverId: true },
  });
  return rows.map((r: { senderId: string; receiverId: string }) => (r.senderId === userId ? r.receiverId : r.senderId));
}

/** Check if two users are friends */
export async function areFriends(a: string, b: string): Promise<boolean> {
  const row = await prisma.friendship.findFirst({
    where: {
      status: 'ACCEPTED',
      OR: [
        { senderId: a, receiverId: b },
        { senderId: b, receiverId: a },
      ],
    },
  });
  return !!row;
}

/** Get accountability partner for a user (returns the other user's ID, or null) */
export async function getAccountabilityPartner(userId: string): Promise<string | null> {
  const row = await prisma.accountabilityPartner.findFirst({
    where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
  });
  if (!row) return null;
  return row.user1Id === userId ? row.user2Id : row.user1Id;
}

export const INVITE_MESSAGES: Record<string, string> = {
  CHEST: 'challenged you to a Chest Day 💪',
  BACK: 'challenged you to a Back Day 🏋️',
  LEGS: 'challenged you to Leg Day 🦵',
  SHOULDERS: 'challenged you to a Shoulder Session 🔝',
  ARMS: 'challenged you to an Arms Day 💪',
  FULL_BODY: 'challenged you to a Full Body Blast 🔥',
};
