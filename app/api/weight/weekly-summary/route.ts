import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function computeTDEE(user: {
  startingWeight: number | null;
  heightCm: number | null;
  age: number | null;
  sex: string | null;
  stepsPerWeek: number | null;
  liftingSessionsPerWeek: number | null;
  avgSessionDurationMin: number | null;
}, currentWeight: number | null): number | null {
  const w = currentWeight ?? user.startingWeight;
  const { heightCm, age, sex, stepsPerWeek } = user;
  if (!w || !heightCm || !age || !sex || !stepsPerWeek) return null;
  const base = 10 * w + 6.25 * heightCm - 5 * age;
  const bmr = Math.round(sex === 'MALE' ? base + 5 : base - 161);
  const neat = Math.round((stepsPerWeek / 7) * 0.04);
  const sessions = user.liftingSessionsPerWeek ?? 0;
  const duration = user.avgSessionDurationMin ?? 60;
  const eat = Math.round((sessions * duration * 5) / 7);
  const tef = Math.round(bmr * 0.1);
  return bmr + neat + eat + tef;
}

function itemMacros(item: {
  quantity: number;
  cookState: string;
  food: {
    calories: number; protein: number; carbs: number; fat: number;
    rawCalories: number | null; rawProtein: number | null;
    rawCarbs: number | null; rawFat: number | null;
  };
}) {
  const useRaw = item.cookState === 'RAW' && item.food.rawCalories != null;
  const f = item.food;
  const factor = item.quantity / 100;
  return {
    calories: (useRaw ? f.rawCalories! : f.calories) * factor,
    protein:  (useRaw ? (f.rawProtein  ?? f.protein) : f.protein)  * factor,
    carbs:    (useRaw ? (f.rawCarbs    ?? f.carbs)   : f.carbs)    * factor,
    fat:      (useRaw ? (f.rawFat      ?? f.fat)     : f.fat)      * factor,
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const startParam = searchParams.get('start');

    if (!startParam) return NextResponse.json({ error: 'start required' }, { status: 400 });

    const weekStart = new Date(startParam + 'T00:00:00Z');
    const weekEnd   = new Date(startParam + 'T00:00:00Z');
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

    const [user, weightLogs, mealLogs, latestWeight] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          startingWeight: true, heightCm: true, age: true, sex: true,
          stepsPerWeek: true, liftingSessionsPerWeek: true, avgSessionDurationMin: true,
          caloricTarget: true, weeklyGoalKg: true,
        },
      }),
      prisma.weightLog.findMany({
        where: { userId, date: { gte: weekStart, lte: weekEnd } },
        orderBy: { date: 'asc' },
      }),
      prisma.mealLog.findMany({
        where: { userId, date: { gte: weekStart, lte: weekEnd } },
        include: { items: { include: { food: true } } },
        orderBy: { date: 'asc' },
      }),
      prisma.weightLog.findFirst({
        where: { userId },
        orderBy: { date: 'desc' },
        select: { weight: true },
      }),
    ]);

    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const tdee = computeTDEE(user, latestWeight?.weight ?? null);
    const refWeight = latestWeight?.weight ?? user.startingWeight;
    const proteinTargetG = refWeight ? Math.round(refWeight * 1.8) : null;

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setUTCDate(d.getUTCDate() + i);
      const dateStr = d.toISOString().split('T')[0];

      const wlog = weightLogs.find((l) => l.date.toISOString().split('T')[0] === dateStr);
      const mlog = mealLogs.find((l) => l.date.toISOString().split('T')[0] === dateStr);

      let calories: number | null = null;
      let protein: number | null = null;
      let carbs: number | null = null;
      let fat: number | null = null;

      if (mlog && mlog.items.length > 0) {
        calories = 0; protein = 0; carbs = 0; fat = 0;
        for (const item of mlog.items) {
          const m = itemMacros(item);
          calories += m.calories;
          protein  += m.protein;
          carbs    += m.carbs;
          fat      += m.fat;
        }
        calories = Math.round(calories);
        protein  = Math.round(protein  * 10) / 10;
        carbs    = Math.round(carbs    * 10) / 10;
        fat      = Math.round(fat      * 10) / 10;
      }

      return { date: dateStr, weight: wlog?.weight ?? null, calories, protein, carbs, fat };
    });

    return NextResponse.json({ tdee, caloricTarget: user.caloricTarget, proteinTargetG, days });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
