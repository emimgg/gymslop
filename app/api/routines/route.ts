import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkTrophies } from '@/lib/trophies';

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const routines = await prisma.routine.findMany({
      where: { userId },
      include: {
        days: {
          include: {
            exercises: {
              include: { exercise: true },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { dayOfWeek: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(routines);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const body = await req.json();
    const { name, days } = body;

    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

    const routine = await prisma.routine.create({
      data: {
        userId,
        name,
        days: {
          create: (days ?? []).map((day: { dayOfWeek: number; exercises: { exerciseId: string; order: number; targetSets: number; targetReps: number; targetWeight?: number; setTechniques?: string[]; targetRIR?: number | null; targetRPE?: number | null }[] }) => ({
            dayOfWeek: day.dayOfWeek,
            exercises: {
              create: day.exercises.map((ex) => ({
                exerciseId: ex.exerciseId,
                order: ex.order,
                targetSets: ex.targetSets ?? 3,
                targetReps: ex.targetReps ?? 10,
                targetWeight: ex.targetWeight ?? null,
                setTechniques: ex.setTechniques ?? [],
                targetRIR: ex.targetRIR ?? null,
                targetRPE: ex.targetRPE ?? null,
              })),
            },
          })),
        },
      },
      include: {
        days: { include: { exercises: { include: { exercise: true } } } },
      },
    });

    await checkTrophies(userId);
    return NextResponse.json(routine, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
