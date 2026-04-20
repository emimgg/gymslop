import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { areFriends, createNotification, getAccountabilityPartner } from '@/lib/social';
import { todayUTC } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const { partnerId } = await req.json();

    if (!partnerId || partnerId === userId) {
      return NextResponse.json({ error: 'Invalid partner' }, { status: 400 });
    }

    const friends = await areFriends(userId, partnerId);
    if (!friends) return NextResponse.json({ error: 'Not friends' }, { status: 403 });

    // Remove any existing accountability partnerships for both users
    await prisma.accountabilityPartner.deleteMany({
      where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
    });

    const partnership = await prisma.accountabilityPartner.create({
      data: { user1Id: userId, user2Id: partnerId },
    });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    await createNotification(
      partnerId,
      'FRIEND_ACCEPTED',
      `${user?.name ?? 'Someone'} set you as their accountability partner! Keep each other on track 💪`,
      `/social/profile/${userId}`,
    );

    return NextResponse.json({ partnership }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    await prisma.accountabilityPartner.deleteMany({
      where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** Called on dashboard load to check if accountability partner missed yesterday */
export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const partnerId = await getAccountabilityPartner(userId);
    if (!partnerId) return NextResponse.json({ partner: null });

    const partner = await prisma.user.findUnique({
      where: { id: partnerId },
      select: { id: true, name: true, image: true, level: true, currentStreak: true, lastActiveAt: true },
    });

    if (!partner) return NextResponse.json({ partner: null });

    // Check if partner missed yesterday
    const today = todayUTC();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const partnerActiveYesterday = partner.lastActiveAt && new Date(partner.lastActiveAt) >= yesterday;

    if (!partnerActiveYesterday) {
      // Check if we already sent this notification today
      const alreadyNotified = await prisma.notification.findFirst({
        where: {
          userId,
          type: 'ACCOUNTABILITY_MISS',
          createdAt: { gte: today },
          message: { contains: partner.name ?? '' },
        },
      });

      if (!alreadyNotified) {
        await createNotification(
          userId,
          'ACCOUNTABILITY_MISS',
          `${partner.name ?? 'Your partner'} hasn't logged a workout yet today — check in on them! 👀`,
          `/social/profile/${partnerId}`,
        );
      }
    }

    return NextResponse.json({ partner, partnerActiveYesterday });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
