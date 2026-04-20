import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/social';

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const [accepted, pendingReceived, pendingSent] = await Promise.all([
      prisma.friendship.findMany({
        where: { status: 'ACCEPTED', OR: [{ senderId: userId }, { receiverId: userId }] },
        include: {
          sender: { select: { id: true, name: true, email: true, image: true, level: true, xp: true, currentStreak: true, lastActiveAt: true } },
          receiver: { select: { id: true, name: true, email: true, image: true, level: true, xp: true, currentStreak: true, lastActiveAt: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.friendship.findMany({
        where: { status: 'PENDING', receiverId: userId },
        include: {
          sender: { select: { id: true, name: true, email: true, image: true, level: true, xp: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.friendship.findMany({
        where: { status: 'PENDING', senderId: userId },
        include: {
          receiver: { select: { id: true, name: true, email: true, image: true, level: true, xp: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const friends = accepted.map((f) => ({
      id: f.id,
      friend: f.senderId === userId ? f.receiver : f.sender,
      since: f.updatedAt,
    }));

    return NextResponse.json({ friends, pendingReceived, pendingSent });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const { receiverId } = await req.json();

    if (!receiverId || receiverId === userId) {
      return NextResponse.json({ error: 'Invalid receiver' }, { status: 400 });
    }

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId },
          { senderId: receiverId, receiverId: userId },
        ],
      },
    });
    if (existing) {
      return NextResponse.json({ error: 'Request already exists' }, { status: 409 });
    }

    const friendship = await prisma.friendship.create({
      data: { senderId: userId, receiverId },
    });

    const sender = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    await createNotification(
      receiverId,
      'FRIEND_REQUEST',
      `${sender?.name ?? 'Someone'} sent you a friend request`,
      `/social`,
    );

    return NextResponse.json({ friendship }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
