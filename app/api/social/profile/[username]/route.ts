import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { areFriends, getAccountabilityPartner } from '@/lib/social';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const session = await requireAuth();
    const viewerId = session.user.id;
    const { username } = await params;
    const slug = decodeURIComponent(username);

    // Accept both username slug and raw ID for backward compatibility
    const user = await prisma.user.findFirst({
      where: { OR: [{ username: slug }, { id: slug }] },
      select: {
        id: true, name: true, image: true, username: true, createdAt: true,
        level: true, xp: true, currentStreak: true, longestStreak: true, lastActiveAt: true,
        userTrophies: {
          include: { trophy: true },
          orderBy: { unlockedAt: 'desc' },
          take: 20,
        },
        workoutSessions: {
          where: { completedAt: { not: null } },
          select: {
            id: true, startedAt: true, completedAt: true, xpEarned: true,
            sets: { select: { reps: true, weight: true, isPR: true, exercise: { select: { name: true, muscleGroup: true } } } },
          },
          orderBy: { startedAt: 'desc' },
          take: 5,
        },
        weightLogs: {
          orderBy: { date: 'desc' },
          take: 5,
          select: { date: true, weight: true },
        },
      },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const targetId = user.id;
    const isOwn = viewerId === targetId;

    if (!isOwn) {
      const friends = await areFriends(viewerId, targetId);
      if (!friends) return NextResponse.json({ error: 'Not friends' }, { status: 403 });
    }

    const allSessions = await prisma.workoutSession.findMany({
      where: { userId: targetId, completedAt: { not: null } },
      select: { sets: { select: { reps: true, weight: true, isPR: true } } },
    });
    const totalWeight = allSessions.reduce(
      (s, sess) => s + sess.sets.reduce((ss, set) => ss + set.reps * set.weight, 0),
      0,
    );
    const totalPRs = allSessions.reduce(
      (s, sess) => s + sess.sets.filter((set) => set.isPR).length,
      0,
    );

    const accountabilityPartnerId = await getAccountabilityPartner(targetId);

    const recentActivity = user.workoutSessions.map((s) => ({
      type: 'workout' as const,
      date: s.startedAt,
      xpEarned: s.xpEarned,
      prCount: s.sets.filter((set) => set.isPR).length,
      totalSets: s.sets.length,
      muscleGroups: [...new Set(s.sets.map((set) => set.exercise.muscleGroup))],
    }));

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        image: user.image,
        createdAt: user.createdAt,
        level: user.level,
        xp: user.xp,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        lastActiveAt: user.lastActiveAt,
        totalWorkouts: allSessions.length,
        totalWeight: Math.round(totalWeight),
        totalPRs,
        trophies: user.userTrophies,
        weightLogs: user.weightLogs,
      },
      recentActivity,
      isOwn,
      accountabilityPartnerId,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
