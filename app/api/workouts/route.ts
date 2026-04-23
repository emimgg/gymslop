import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { awardXp, checkTrophies } from '@/lib/trophies';
import { XP } from '@/lib/xp';
import { todayUTC } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') ?? '10');

    const sessions = await prisma.workoutSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: {
        sets: {
          include: { exercise: true },
          orderBy: { setNumber: 'asc' },
        },
      },
    });

    return NextResponse.json(sessions);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const body = await req.json();
    const { routineId, sets } = body;
    // sets: [{ exerciseId, setNumber, reps, weight, isWarmup, technique?, attachedTechnique?, tempo?, targetRIR?, targetRPE?, actualRIR?, actualRPE? }]

    // PR check only on NORMAL sets — technique attachments are ignored for PR detection
    const setsWithPr = await Promise.all(
      (sets ?? []).map(async (s: {
        exerciseId: string; setNumber: number; reps: number; weight: number;
        isWarmup: boolean; technique?: string; attachedTechnique?: string | null;
        tempo?: string | null; targetRIR?: number | null; targetRPE?: number | null;
        actualRIR?: number | null; actualRPE?: number | null;
      }) => {
        const technique = 'NORMAL'; // always NORMAL — technique attachments live in attachedTechnique
        let isPR = false;
        if (true) {
          const previousSessionCount = await prisma.workoutSession.count({
            where: {
              userId,
              sets: { some: { exerciseId: s.exerciseId } },
            },
          });
          if (previousSessionCount >= 2) {
            const pr = await prisma.workoutSet.findFirst({
              where: { session: { userId }, exerciseId: s.exerciseId, technique: 'NORMAL' },
              orderBy: { weight: 'desc' },
            });
            isPR = !pr || s.weight > pr.weight;
          }
        }
        return { ...s, technique, isPR };
      })
    );

    const prCount = setsWithPr.filter((s) => s.isPR).length;
    const xpEarned = XP.WORKOUT_COMPLETE + prCount * XP.PR_BROKEN;

    const workout = await prisma.workoutSession.create({
      data: {
        userId,
        routineId: routineId ?? null,
        completedAt: new Date(),
        xpEarned,
        sets: {
          create: setsWithPr.map((s) => ({
            exerciseId: s.exerciseId,
            setNumber: s.setNumber,
            reps: s.reps,
            weight: s.weight,
            isWarmup: s.isWarmup ?? false,
            isPR: s.isPR,
            technique: 'NORMAL',
            attachedTechnique: s.attachedTechnique ?? null,
            tempo: s.tempo ?? null,
            targetRIR: s.targetRIR ?? null,
            targetRPE: s.targetRPE ?? null,
            actualRIR: s.actualRIR ?? null,
            actualRPE: s.actualRPE ?? null,
          })),
        },
      },
      include: { sets: { include: { exercise: true } } },
    });

    // Update streak
    const today = todayUTC();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      const lastActive = user.lastActiveAt ? new Date(user.lastActiveAt) : null;
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      let newStreak = user.currentStreak;
      if (!lastActive || lastActive < yesterday) {
        newStreak = 1;
      } else if (lastActive.toDateString() === yesterday.toDateString()) {
        newStreak += 1;
      }
      await prisma.user.update({
        where: { id: userId },
        data: {
          lastActiveAt: today,
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, user.longestStreak),
        },
      });
    }

    await awardXp(userId, xpEarned);
    const newTrophies = await checkTrophies(userId);

    return NextResponse.json({ workout, xpEarned, prCount, newTrophies }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
