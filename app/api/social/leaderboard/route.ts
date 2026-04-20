import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getFriendIds } from '@/lib/social';

type Category = 'workouts' | 'weight' | 'streak' | 'trophies' | 'prs';
type Period = 'week' | 'month' | 'alltime';

function periodStart(period: Period): Date | null {
  if (period === 'alltime') return null;
  const d = new Date();
  if (period === 'week') d.setDate(d.getDate() - 7);
  if (period === 'month') d.setDate(d.getDate() - 30);
  return d;
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const category = (searchParams.get('category') ?? 'workouts') as Category;
    const period = (searchParams.get('period') ?? 'alltime') as Period;

    const friendIds = await getFriendIds(userId);
    const allIds = [userId, ...friendIds];
    const since = periodStart(period);

    const users = await prisma.user.findMany({
      where: { id: { in: allIds } },
      select: {
        id: true, name: true, image: true, level: true, xp: true,
        currentStreak: true, longestStreak: true,
        workoutSessions: {
          where: since ? { completedAt: { gte: since } } : {},
          select: {
            completedAt: true,
            sets: { select: { reps: true, weight: true, isPR: true } },
          },
        },
        userTrophies: {
          where: since ? { unlockedAt: { gte: since } } : {},
          select: { id: true },
        },
      },
    });

    const rows = users.map((u) => {
      const completedSessions = u.workoutSessions.filter((s) => s.completedAt);
      const totalWeight = completedSessions.reduce(
        (sum, s) => sum + s.sets.reduce((ss, set) => ss + set.reps * set.weight, 0),
        0,
      );
      const prCount = completedSessions.reduce(
        (sum, s) => sum + s.sets.filter((set) => set.isPR).length,
        0,
      );
      return {
        id: u.id,
        name: u.name,
        image: u.image,
        level: u.level,
        xp: u.xp,
        workouts: completedSessions.length,
        totalWeight: Math.round(totalWeight),
        streak: u.currentStreak,
        trophies: u.userTrophies.length,
        prs: prCount,
        isMe: u.id === userId,
      };
    });

    const sortKey: Record<Category, keyof (typeof rows)[0]> = {
      workouts: 'workouts',
      weight: 'totalWeight',
      streak: 'streak',
      trophies: 'trophies',
      prs: 'prs',
    };

    rows.sort((a, b) => (b[sortKey[category]] as number) - (a[sortKey[category]] as number));

    return NextResponse.json({ rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
