import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { awardXp, checkTrophies } from '@/lib/trophies';
import { XP } from '@/lib/xp';
import { MealType } from '@prisma/client';
import { todayUTC } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    const date = dateParam ? new Date(dateParam) : todayUTC();

    const mealLog = await prisma.mealLog.findUnique({
      where: { userId_date: { userId, date } },
      include: {
        items: { include: { food: true } },
      },
    });

    return NextResponse.json(mealLog);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const body = await req.json();

    const logDate = body.date ? new Date(body.date) : todayUTC();

    const existingLog = await prisma.mealLog.findUnique({
      where: { userId_date: { userId, date: logDate } },
    });

    const mealLog = await prisma.mealLog.upsert({
      where: { userId_date: { userId, date: logDate } },
      create: { userId, date: logDate },
      update: {},
    });

    if (!existingLog) {
      await awardXp(userId, XP.MEAL_LOG);
    }

    // Batch mode: body.items is an array of food entries
    if (Array.isArray(body.items)) {
      const { items } = body;
      if (items.length === 0) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
      }
      for (const entry of items) {
        if (!entry.foodId || !entry.quantity || !entry.mealType) {
          return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }
      }
      const created = await prisma.$transaction(
        items.map((entry: { foodId: string; quantity: number; mealType: string; cookState?: string }) =>
          prisma.mealLogItem.create({
            data: {
              mealLogId: mealLog.id,
              foodId: entry.foodId,
              mealType: entry.mealType as MealType,
              quantity: parseFloat(String(entry.quantity)),
              cookState: entry.cookState ?? 'RAW',
            },
            include: { food: true },
          })
        )
      );
      await checkTrophies(userId);
      return NextResponse.json(created, { status: 201 });
    }

    // Single-item mode (used by the manual log modal)
    const { foodId, quantity, mealType, cookState } = body;
    if (!foodId || !quantity || !mealType) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const item = await prisma.mealLogItem.create({
      data: {
        mealLogId: mealLog.id,
        foodId,
        mealType: mealType as MealType,
        quantity: parseFloat(quantity),
        cookState: cookState ?? 'RAW',
      },
      include: { food: true },
    });
    await checkTrophies(userId);
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 });

    // Verify ownership
    const item = await prisma.mealLogItem.findFirst({
      where: { id: itemId, mealLog: { userId } },
    });
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.mealLogItem.delete({ where: { id: itemId } });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
