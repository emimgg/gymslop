import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { todayUTC, toDateOnly } from '@/lib/utils';

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const today = todayUTC();
    const todayStr = toDateOnly(today);

    const [
      user,
      workoutToday,
      mealToday,
      weightToday,
      feelsToday,
      recentTrophies,
      weightLogs,
    ] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { xp: true, level: true, currentStreak: true, longestStreak: true } }),
      prisma.workoutSession.findFirst({ where: { userId, completedAt: { gte: today } }, select: { id: true, routineId: true } }),
      prisma.mealLog.findFirst({ where: { userId, date: today } }),
      prisma.weightLog.findFirst({ where: { userId, date: today } }),
      prisma.feelsLog.findFirst({ where: { userId, date: today } }),
      prisma.userTrophy.findMany({
        where: { userId },
        orderBy: { unlockedAt: 'desc' },
        take: 3,
        include: { trophy: true },
      }),
      prisma.weightLog.findMany({
        where: { userId },
        orderBy: { date: 'asc' },
        take: 14,
        select: { date: true, weight: true },
      }),
    ]);

    let workoutRoutineName: string | null = null;
    if (workoutToday?.routineId) {
      const routine = await prisma.routine.findUnique({
        where: { id: workoutToday.routineId },
        select: { name: true },
      });
      workoutRoutineName = routine?.name ?? null;
    }

    return NextResponse.json({
      user,
      today: {
        workout: !!workoutToday,
        workoutRoutineId: workoutToday?.routineId ?? null,
        workoutRoutineName,
        meals: !!mealToday,
        weight: !!weightToday,
        feels: !!feelsToday,
      },
      recentTrophies: recentTrophies.map((ut) => ({
        key: ut.trophy.key,
        name: ut.trophy.name,
        icon: ut.trophy.icon,
        unlockedAt: ut.unlockedAt,
      })),
      weightTrend: weightLogs.map((w) => ({ date: toDateOnly(w.date), weight: w.weight })),
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
