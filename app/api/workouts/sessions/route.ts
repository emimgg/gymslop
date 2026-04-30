import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 200);

    const sessions = await prisma.workoutSession.findMany({
      where: { userId, completedAt: { not: null } },
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: {
        sets: {
          include: { exercise: { select: { id: true, name: true } } },
          orderBy: { setNumber: 'asc' },
        },
      },
    });

    // Batch-fetch routine names
    const routineIds = [...new Set(sessions.map((s) => s.routineId).filter(Boolean))] as string[];
    const routineMap: Record<string, string> = {};
    if (routineIds.length > 0) {
      const routines = await prisma.routine.findMany({
        where: { id: { in: routineIds } },
        select: { id: true, name: true },
      });
      for (const r of routines) routineMap[r.id] = r.name;
    }

    const result = sessions.map((s) => {
      // Group sets by exercise, preserving insertion order
      const exerciseMap = new Map<string, { name: string; sets: typeof s.sets }>();
      for (const set of s.sets) {
        if (!exerciseMap.has(set.exerciseId)) {
          exerciseMap.set(set.exerciseId, { name: set.exercise.name, sets: [] });
        }
        exerciseMap.get(set.exerciseId)!.sets.push(set);
      }

      const totalSets = s.sets.length;
      const totalVolume = Math.round(s.sets.reduce((sum, set) => sum + set.weight * set.reps, 0));
      const prCount = s.sets.filter((set) => set.isPR).length;
      const durationMin = s.completedAt
        ? Math.round((new Date(s.completedAt).getTime() - new Date(s.startedAt).getTime()) / 60_000)
        : 0;

      return {
        id: s.id,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
        routineId: s.routineId,
        routineName: s.routineId ? (routineMap[s.routineId] ?? null) : null,
        xpEarned: s.xpEarned,
        totalSets,
        totalVolume,
        durationMin,
        prCount,
        exercises: Array.from(exerciseMap.entries()).map(([exerciseId, data]) => ({
          exerciseId,
          name: data.name,
          sets: data.sets.map((set) => ({
            setNumber: set.setNumber,
            reps: set.reps,
            weight: set.weight,
            isPR: set.isPR,
          })),
        })),
      };
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
