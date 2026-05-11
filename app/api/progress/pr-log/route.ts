import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const prSets = await prisma.workoutSet.findMany({
      where: { session: { userId }, isPR: true },
      include: {
        exercise: { select: { name: true, muscleGroup: true } },
        session: { select: { startedAt: true } },
      },
      orderBy: { session: { startedAt: 'desc' } },
      take: 10,
    });

    return NextResponse.json(
      prSets.map((s) => ({
        id: s.id,
        exerciseName: s.exercise.name,
        muscleGroup: s.exercise.muscleGroup,
        weight: s.weight,
        reps: s.reps,
        date: s.session.startedAt.toISOString(),
      }))
    );
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
