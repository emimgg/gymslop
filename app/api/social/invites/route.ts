import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { areFriends, createNotification, INVITE_MESSAGES } from '@/lib/social';

const inviteInclude = {
  sender: { select: { id: true, name: true, image: true, level: true } },
  receiver: { select: { id: true, name: true, image: true, level: true } },
};

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const [received, sent] = await Promise.all([
      prisma.trainingInvite.findMany({
        where: { receiverId: userId },
        include: inviteInclude,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.trainingInvite.findMany({
        where: { senderId: userId },
        include: inviteInclude,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({ received, sent });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const { receiverId, muscleGroup, proposedTime, message } = await req.json();

    if (!receiverId || !muscleGroup || !proposedTime) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const friends = await areFriends(userId, receiverId);
    if (!friends) {
      return NextResponse.json({ error: 'Not friends' }, { status: 403 });
    }

    const invite = await prisma.trainingInvite.create({
      data: { senderId: userId, receiverId, muscleGroup, proposedTime: new Date(proposedTime), message },
      include: inviteInclude,
    });

    const sender = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    const verb = INVITE_MESSAGES[muscleGroup] ?? 'invited you to train';
    await createNotification(
      receiverId,
      'TRAINING_INVITE',
      `${sender?.name ?? 'Someone'} ${verb}`,
      `/social`,
    );

    return NextResponse.json({ invite }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
