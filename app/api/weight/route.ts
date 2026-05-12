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
    const limit = parseInt(searchParams.get('limit') ?? '90');

    const [logs, user, earliestLog] = await Promise.all([
      prisma.weightLog.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: limit,
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { startingWeight: true, goalWeight: true },
      }),
      prisma.weightLog.findFirst({
        where: { userId },
        orderBy: { date: 'asc' },
        select: { weight: true, date: true },
      }),
    ]);

    // Self-heal: always keep startingWeight in sync with the actual earliest log
    if (earliestLog && user?.startingWeight !== earliestLog.weight) {
      await prisma.user.update({ where: { id: userId }, data: { startingWeight: earliestLog.weight } });
    }

    return NextResponse.json({
      logs,
      startingWeight: earliestLog?.weight ?? user?.startingWeight ?? null,
      startingDate: earliestLog?.date ?? null,
      goalWeight: user?.goalWeight ?? null,
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const body = await req.json();
    const { weight, note, date, weighingTime } = body;

    if (!weight) return NextResponse.json({ error: 'Weight required' }, { status: 400 });

    const logDate = date ? new Date(date) : todayUTC();

    const log = await prisma.weightLog.upsert({
      where: { userId_date: { userId, date: logDate } },
      update: { weight: parseFloat(weight), note: note ?? null, weighingTime: weighingTime ?? null },
      create: { userId, date: logDate, weight: parseFloat(weight), note: note ?? null, weighingTime: weighingTime ?? null },
    });

    // Always keep startingWeight locked to the earliest log entry
    const earliest = await prisma.weightLog.findFirst({
      where: { userId },
      orderBy: { date: 'asc' },
      select: { weight: true },
    });
    if (earliest) {
      await prisma.user.update({ where: { id: userId }, data: { startingWeight: earliest.weight } });
    }

    await awardXp(userId, XP.WEIGHT_LOG);
    await checkTrophies(userId);

    return NextResponse.json(log, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
