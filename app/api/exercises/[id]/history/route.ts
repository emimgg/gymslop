import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Ctx) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const { id: exerciseId } = await params;

    // All sessions where this exercise was performed (NORMAL, non-warmup)
    const sets = await prisma.workoutSet.findMany({
      where: {
        exerciseId,
        session: { userId },
        technique: 'NORMAL',
        isWarmup: false,
        weight: { gt: 0 },
        reps: { gt: 0 },
      },
      include: { session: { select: { startedAt: true } } },
      orderBy: { session: { startedAt: 'asc' } },
    });

    if (sets.length === 0) {
      return NextResponse.json({ sessions: [], pr: null, timesPerformed: 0, firstDate: null, lastDate: null });
    }

    // e1RM via Epley formula: weight * (1 + reps / 30)
    const e1RM = (weight: number, reps: number) => weight * (1 + reps / 30);

    // Group sets by session date (YYYY-MM-DD)
    const byDate = new Map<string, { date: string; sets: typeof sets; best1RM: number }>();
    for (const s of sets) {
      const date = s.session.startedAt.toISOString().slice(0, 10);
      if (!byDate.has(date)) byDate.set(date, { date, sets: [], best1RM: 0 });
      const entry = byDate.get(date)!;
      entry.sets.push(s);
      const rm = e1RM(s.weight, s.reps);
      if (rm > entry.best1RM) entry.best1RM = rm;
    }

    const sessions = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));

    // All-time PR by e1RM
    let prSet = sets[0];
    let prE1RM = e1RM(sets[0].weight, sets[0].reps);
    for (const s of sets) {
      const rm = e1RM(s.weight, s.reps);
      if (rm > prE1RM) { prE1RM = rm; prSet = s; }
    }

    // Unique session count
    const uniqueDates = new Set(sets.map((s) => s.session.startedAt.toISOString().slice(0, 10)));
    const timesPerformed = uniqueDates.size;
    const allDates = [...uniqueDates].sort();
    const firstDate = allDates[0];
    const lastDate = allDates[allDates.length - 1];

    // Last 5 sessions as mini log
    const last5 = sessions.slice(-5).reverse().map((s) => ({
      date: s.date,
      sets: s.sets.map((ws) => ({ reps: ws.reps, weight: ws.weight })),
    }));

    // Chart data: date + best e1RM per day
    const chartData = sessions.map((s) => ({
      date: s.date,
      e1rm: Math.round(s.best1RM * 10) / 10,
    }));

    return NextResponse.json({
      chartData,
      pr: { weight: prSet.weight, reps: prSet.reps, e1rm: Math.round(prE1RM * 10) / 10, date: prSet.session.startedAt.toISOString().slice(0, 10) },
      timesPerformed,
      firstDate,
      lastDate,
      last5,
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
