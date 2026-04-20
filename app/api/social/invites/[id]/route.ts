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

    const invite = await prisma.trainingInvite.findUnique({ where: { id } });
    if (!invite || invite.receiverId !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const status = action === 'accept' ? 'ACCEPTED' : 'DECLINED';
    const updated = await prisma.trainingInvite.update({
      where: { id },
      data: { status },
    });

    if (action === 'accept') {
      const receiver = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
      await createNotification(
        invite.senderId,
        'TRAINING_ACCEPTED',
        `${receiver?.name ?? 'Someone'} accepted your ${invite.muscleGroup} training invite!`,
        `/social`,
      );
    }

    return NextResponse.json({ invite: updated });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
