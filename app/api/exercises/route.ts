import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MuscleGroup, Equipment } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const muscleGroup = searchParams.get('muscleGroup') as MuscleGroup | null;

    const exercises = await prisma.exercise.findMany({
      where: {
        AND: [
          muscleGroup ? { muscleGroup } : {},
          { OR: [{ isCustom: false }, { createdById: userId }] },
        ],
      },
      orderBy: [{ isCustom: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json(exercises);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const body = await req.json();
    const { name, muscleGroup, equipment } = body;

    if (!name || !muscleGroup || !equipment) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const exercise = await prisma.exercise.create({
      data: {
        name,
        muscleGroup: muscleGroup as MuscleGroup,
        equipment: equipment as Equipment,
        isCustom: true,
        createdById: userId,
      },
    });

    return NextResponse.json(exercise, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
