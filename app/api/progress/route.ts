import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkTrophies } from '@/lib/trophies';

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const [prs, measurements] = await Promise.all([
      // Get all-time PRs per exercise — NORMAL sets only
      prisma.$queryRaw<{ exerciseId: string; exerciseName: string; muscleGroup: string; weight: number; reps: number; date: Date }[]>`
        SELECT DISTINCT ON (ws."exerciseId")
          ws."exerciseId",
          e.name as "exerciseName",
          e."muscleGroup" as "muscleGroup",
          ws.weight,
          ws.reps,
          wss."startedAt" as date
        FROM "WorkoutSet" ws
        JOIN "Exercise" e ON e.id = ws."exerciseId"
        JOIN "WorkoutSession" wss ON wss.id = ws."sessionId"
        WHERE wss."userId" = ${userId}
          AND ws.technique = 'NORMAL'
        ORDER BY ws."exerciseId", ws.weight DESC
      `,
      prisma.bodyMeasurement.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 20,
      }),
    ]);

    return NextResponse.json({ prs, measurements });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const body = await req.json();
    const { neck, chest, waist, hips, leftArm, rightArm, leftThigh, rightThigh, date } = body;

    const { todayUTC } = await import('@/lib/utils');
    const logDate = date ? new Date(date) : todayUTC();

    const measurement = await prisma.bodyMeasurement.create({
      data: {
        userId,
        date: logDate,
        neck: neck ? parseFloat(neck) : null,
        chest: chest ? parseFloat(chest) : null,
        waist: waist ? parseFloat(waist) : null,
        hips: hips ? parseFloat(hips) : null,
        leftArm: leftArm ? parseFloat(leftArm) : null,
        rightArm: rightArm ? parseFloat(rightArm) : null,
        leftThigh: leftThigh ? parseFloat(leftThigh) : null,
        rightThigh: rightThigh ? parseFloat(rightThigh) : null,
      },
    });

    await checkTrophies(userId);
    return NextResponse.json(measurement, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
