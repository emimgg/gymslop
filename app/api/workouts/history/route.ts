import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** Returns all sets from last workout session + PR (NORMAL sets only) for an exercise */
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const exerciseId = searchParams.get('exerciseId');

    if (!exerciseId) return NextResponse.json({ error: 'exerciseId required' }, { status: 400 });

    const lastSetEntry = await prisma.workoutSet.findFirst({
      where: { session: { userId }, exerciseId },
      orderBy: { createdAt: 'desc' },
      select: { sessionId: true },
    });

    const [lastSets, prSet] = await Promise.all([
      lastSetEntry
        ? prisma.workoutSet.findMany({
            where: { sessionId: lastSetEntry.sessionId, exerciseId },
            orderBy: { setNumber: 'asc' },
            select: { setNumber: true, reps: true, weight: true, technique: true },
          })
        : Promise.resolve([]),
      // PR only from NORMAL sets
      prisma.workoutSet.findFirst({
        where: { session: { userId }, exerciseId, technique: 'NORMAL' },
        orderBy: { weight: 'desc' },
      }),
    ]);

    return NextResponse.json({
      lastSets,
      pr: prSet ? { reps: prSet.reps, weight: prSet.weight } : null,
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
