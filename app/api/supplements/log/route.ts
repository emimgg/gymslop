import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { todayUTC } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const { searchParams } = new URL(req.url);

    const date = searchParams.get('date');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { userId };

    if (date) {
      where.date = new Date(date);
    } else if (from && to) {
      where.date = { gte: new Date(from), lte: new Date(to) };
    }

    const logs = await prisma.supplementLog.findMany({
      where,
      orderBy: { date: 'asc' },
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
    const { supplement, taken, dose, date } = await req.json();

    if (!supplement) return NextResponse.json({ error: 'Supplement required' }, { status: 400 });

    const logDate = date ? new Date(date) : todayUTC();

    const log = await prisma.supplementLog.upsert({
      where: { userId_date_supplement: { userId, date: logDate, supplement } },
      update: { taken: taken ?? false, ...(dose !== undefined && { dose }) },
      create: { userId, date: logDate, supplement, taken: taken ?? false, dose: dose ?? null },
    });

    return NextResponse.json(log);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
