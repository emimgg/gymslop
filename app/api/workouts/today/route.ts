import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { todayUTC } from '@/lib/utils';

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const today = todayUTC();

    const workoutSession = await prisma.workoutSession.findFirst({
      where: { userId, completedAt: { gte: today } },
      select: { routineId: true },
    });

    if (!workoutSession) {
      return NextResponse.json({ completed: false, routineId: null, routineName: null });
    }

    let routineName: string | null = null;
    if (workoutSession.routineId) {
      const routine = await prisma.routine.findUnique({
        where: { id: workoutSession.routineId },
        select: { name: true },
      });
      routineName = routine?.name ?? null;
    }

    return NextResponse.json({
      completed: true,
      routineId: workoutSession.routineId,
      routineName,
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
