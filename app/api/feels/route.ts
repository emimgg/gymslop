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
    const limit = parseInt(searchParams.get('limit') ?? '30');

    const logs = await prisma.feelsLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit,
    });

    return NextResponse.json(logs);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const body = await req.json();
    const { sleep, performance, hunger, energy, stress, mood, note, date } = body;

    if ([sleep, performance, hunger, energy, stress, mood].some((v) => v == null)) {
      return NextResponse.json({ error: 'All ratings required' }, { status: 400 });
    }

    const logDate = date ? new Date(date) : todayUTC();

    const log = await prisma.feelsLog.upsert({
      where: { userId_date: { userId, date: logDate } },
      update: { sleep, performance, hunger, energy, stress, mood, note: note ?? null },
      create: { userId, date: logDate, sleep, performance, hunger, energy, stress, mood, note: note ?? null },
    });

    await awardXp(userId, XP.FEELS_LOG);
    await checkTrophies(userId);

    return NextResponse.json(log, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
