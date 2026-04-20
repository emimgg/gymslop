import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/social';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const { action } = await req.json(); // 'accept' | 'decline'
    const { id } = await params;

    const friendship = await prisma.friendship.findUnique({ where: { id } });
    if (!friendship || friendship.receiverId !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const status = action === 'accept' ? 'ACCEPTED' : 'DECLINED';
    const updated = await prisma.friendship.update({
      where: { id },
      data: { status },
    });

    if (action === 'accept') {
      const receiver = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
      await createNotification(
        friendship.senderId,
        'FRIEND_ACCEPTED',
        `${receiver?.name ?? 'Someone'} accepted your friend request`,
        `/social/profile/${userId}`,
      );
    }

    return NextResponse.json({ friendship: updated });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const { id } = await params;

    const friendship = await prisma.friendship.findUnique({ where: { id } });
    if (!friendship || (friendship.senderId !== userId && friendship.receiverId !== userId)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.friendship.delete({ where: { id } });

    // Remove accountability partner if set
    await prisma.accountabilityPartner.deleteMany({
      where: {
        OR: [
          { user1Id: userId, user2Id: friendship.senderId === userId ? friendship.receiverId : friendship.senderId },
          { user2Id: userId, user1Id: friendship.senderId === userId ? friendship.receiverId : friendship.senderId },
        ],
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
