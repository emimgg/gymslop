import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Ctx) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const routine = await prisma.routine.findFirst({
      where: { id, userId: session.user.id },
      include: {
        days: {
          include: { exercises: { include: { exercise: true }, orderBy: { order: 'asc' } } },
          orderBy: { dayOfWeek: 'asc' },
        },
      },
    });
    if (!routine) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(routine);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const { name, days } = body;

    const existing = await prisma.routine.findFirst({ where: { id, userId: session.user.id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.routineDay.deleteMany({ where: { routineId: id } });

    const routine = await prisma.routine.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        days: {
          create: (days ?? []).map((day: { dayOfWeek: number; exercises: { exerciseId: string; order: number; targetSets: number; targetReps: number; targetWeight?: number; setTechniques?: string[] }[] }) => ({
            dayOfWeek: day.dayOfWeek,
            exercises: {
              create: day.exercises.map((ex) => ({
                exerciseId: ex.exerciseId,
                order: ex.order,
                targetSets: ex.targetSets ?? 3,
                targetReps: ex.targetReps ?? 10,
                targetWeight: ex.targetWeight ?? null,
                setTechniques: ex.setTechniques ?? [],
              })),
            },
          })),
        },
      },
      include: { days: { include: { exercises: { include: { exercise: true } } } } },
    });

    return NextResponse.json(routine);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE(_: NextRequest, { params }: Ctx) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    await prisma.routine.deleteMany({ where: { id, userId: session.user.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
