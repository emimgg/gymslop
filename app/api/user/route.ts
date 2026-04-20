import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await requireAuth();
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        xp: true,
        level: true,
        currentStreak: true,
        longestStreak: true,
        startingWeight: true,
        goalWeight: true,
        heightCm: true,
        age: true,
        sex: true,
        activityLevel: true,
        stepsPerWeek: true,
        liftingSessionsPerWeek: true,
        avgSessionDurationMin: true,
        weeklyGoalKg: true,
        caloricTarget: true,
        createdAt: true,
      },
    });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const {
      goalWeight, startingWeight, heightCm, name, age, sex, activityLevel,
      stepsPerWeek, liftingSessionsPerWeek, avgSessionDurationMin,
      weeklyGoalKg, caloricTarget,
    } = body;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(goalWeight != null && { goalWeight: parseFloat(goalWeight) }),
        ...(startingWeight != null && { startingWeight: parseFloat(startingWeight) }),
        ...(heightCm != null && { heightCm: parseFloat(heightCm) }),
        ...(name != null && { name }),
        ...(age != null && { age: parseInt(age) }),
        ...(sex != null && { sex }),
        ...(activityLevel != null && { activityLevel }),
        ...(stepsPerWeek != null && { stepsPerWeek: parseInt(stepsPerWeek) }),
        ...(liftingSessionsPerWeek != null && { liftingSessionsPerWeek: parseInt(liftingSessionsPerWeek) }),
        ...(avgSessionDurationMin != null && { avgSessionDurationMin: parseInt(avgSessionDurationMin) }),
        ...(weeklyGoalKg != null && { weeklyGoalKg: parseFloat(weeklyGoalKg) }),
        ...(caloricTarget != null && { caloricTarget: parseInt(caloricTarget) }),
      },
    });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
