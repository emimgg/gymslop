import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** Returns count of each intensity technique used this week */
export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const sets = await prisma.workoutSet.findMany({
      where: {
        session: { userId, startedAt: { gte: startOfWeek } },
        NOT: { technique: 'NORMAL' },
      },
      select: { technique: true },
    });

    const counts: Record<string, number> = {};
    for (const s of sets) {
      counts[s.technique] = (counts[s.technique] ?? 0) + 1;
    }

    return NextResponse.json(counts);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
