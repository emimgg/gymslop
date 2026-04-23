import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** Returns sets from last session + PR (NORMAL sets only) for an exercise, scoped to a weekday when provided */
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const exerciseId = searchParams.get('exerciseId');
    const weekdayParam = searchParams.get('weekday');

    if (!exerciseId) return NextResponse.json({ error: 'exerciseId required' }, { status: 400 });

    const weekday = weekdayParam !== null ? parseInt(weekdayParam) : null;
    const filterByWeekday = weekday !== null && !isNaN(weekday);

    let lastSessionId: string | null = null;

    if (filterByWeekday) {
      // Find most recent session on the same weekday (0=Sun … 6=Sat, matches JS Date.getDay())
      const rows = await prisma.$queryRaw<{ sessionId: string }[]>`
        SELECT ws."sessionId"
        FROM "WorkoutSet" ws
        JOIN "WorkoutSession" s ON ws."sessionId" = s.id
        WHERE s."userId" = ${userId}
          AND ws."exerciseId" = ${exerciseId}
          AND EXTRACT(DOW FROM s."startedAt") = ${weekday}
        ORDER BY s."startedAt" DESC
        LIMIT 1
      `;
      lastSessionId = rows[0]?.sessionId ?? null;
    } else {
      const lastSetEntry = await prisma.workoutSet.findFirst({
        where: { session: { userId }, exerciseId },
        orderBy: { createdAt: 'desc' },
        select: { sessionId: true },
      });
      lastSessionId = lastSetEntry?.sessionId ?? null;
    }

    const [lastSets, prSet] = await Promise.all([
      lastSessionId
        ? prisma.workoutSet.findMany({
            where: { sessionId: lastSessionId, exerciseId },
            orderBy: { setNumber: 'asc' },
            select: { setNumber: true, reps: true, weight: true, technique: true, attachedTechnique: true },
          })
        : Promise.resolve([]),
      filterByWeekday
        ? prisma.$queryRaw<{ reps: number; weight: number }[]>`
            SELECT ws."reps", ws."weight"
            FROM "WorkoutSet" ws
            JOIN "WorkoutSession" s ON ws."sessionId" = s.id
            WHERE s."userId" = ${userId}
              AND ws."exerciseId" = ${exerciseId}
              AND ws."technique" = 'NORMAL'
              AND EXTRACT(DOW FROM s."startedAt") = ${weekday}
            ORDER BY ws."weight" DESC
            LIMIT 1
          `.then((r) => r[0] ?? null)
        : prisma.workoutSet
            .findFirst({
              where: { session: { userId }, exerciseId, technique: 'NORMAL' },
              orderBy: { weight: 'desc' },
            })
            .then((r) => (r ? { reps: r.reps, weight: r.weight } : null)),
    ]);

    return NextResponse.json({
      lastSets,
      pr: prSet ? { reps: prSet.reps, weight: prSet.weight } : null,
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
