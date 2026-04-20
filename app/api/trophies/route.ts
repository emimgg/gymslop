import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const [allTrophies, userTrophies] = await Promise.all([
      prisma.trophy.findMany({ orderBy: [{ category: 'asc' }, { xpReward: 'asc' }] }),
      prisma.userTrophy.findMany({ where: { userId }, select: { trophyId: true, unlockedAt: true } }),
    ]);

    const earned = new Map(userTrophies.map((ut) => [ut.trophyId, ut.unlockedAt]));

    const trophies = allTrophies.map((t) => ({
      ...t,
      unlocked: earned.has(t.id),
      unlockedAt: earned.get(t.id) ?? null,
    }));

    return NextResponse.json({
      trophies,
      total: trophies.length,
      unlocked: userTrophies.length,
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
