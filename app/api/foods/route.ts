import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.toLowerCase() ?? '';

    const foods = await prisma.food.findMany({
      where: {
        AND: [
          q ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { searchTerms: { contains: q, mode: 'insensitive' } },
            ],
          } : {},
          { OR: [{ isCustom: false }, { createdById: userId }] },
        ],
      },
      orderBy: [{ isCustom: 'asc' }, { name: 'asc' }],
      take: searchParams.get('all') === 'true' ? undefined : 50,
    });

    return NextResponse.json(foods);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

function parseNum(value: unknown, fallback = 0): number {
  const n = parseFloat(String(value ?? ''));
  return isNaN(n) ? fallback : n;
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const body = await req.json();
    const { name, brand, calories, protein, carbs, fat, fiber, serving } = body;

    if (!name || !calories) {
      return NextResponse.json({ error: 'Name and calories are required' }, { status: 400 });
    }

    const food = await prisma.food.create({
      data: {
        name,
        brand: brand || null,
        calories: parseNum(calories),
        protein: parseNum(protein),
        carbs: parseNum(carbs),
        fat: parseNum(fat),
        fiber: parseNum(fiber),
        serving: parseNum(serving, 100),
        isCustom: true,
        createdById: userId,
      },
    });

    return NextResponse.json(food, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
