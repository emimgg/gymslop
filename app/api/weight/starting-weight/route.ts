import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Reset startingWeight to the user's actual earliest WeightLog entry
export async function POST() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const earliest = await prisma.weightLog.findFirst({
      where: { userId },
      orderBy: { date: 'asc' },
      select: { weight: true, date: true },
    });

    if (!earliest) {
      return NextResponse.json({ error: 'No weight logs found' }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { startingWeight: earliest.weight },
    });

    return NextResponse.json({ startingWeight: earliest.weight, startingDate: earliest.date });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
