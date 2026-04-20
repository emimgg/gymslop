import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { effectiveMacros } from '@/lib/utils';

function mode<T>(arr: T[]): T {
  const freq = new Map<T, number>();
  for (const v of arr) freq.set(v, (freq.get(v) ?? 0) + 1);
  let best = arr[0];
  let bestN = 0;
  for (const [v, n] of freq) {
    if (n > bestN) { best = v; bestN = n; }
  }
  return best;
}

const MEAL_RECENCY: Record<string, number> = {
  DINNER: 4, SNACK: 3, LUNCH: 2, BREAKFAST: 1,
};

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const mealType = searchParams.get('mealType') ?? 'LUNCH';

    const since = new Date();
    since.setDate(since.getDate() - 90);
    const today = new Date().toISOString().split('T')[0];

    const logs = await prisma.mealLog.findMany({
      where: { userId, date: { gte: since } },
      include: { items: { include: { food: true } } },
      orderBy: { date: 'desc' },
    });

    // ── Frequent foods ──────────────────────────────────────────────────────
    const foodStats = new Map<string, {
      food: object; count: number; quantities: number[]; cookStates: string[];
    }>();

    for (const log of logs) {
      for (const item of log.items) {
        const e = foodStats.get(item.foodId);
        if (e) {
          e.count++;
          e.quantities.push(item.quantity);
          e.cookStates.push(item.cookState);
        } else {
          foodStats.set(item.foodId, {
            food: item.food,
            count: 1,
            quantities: [item.quantity],
            cookStates: [item.cookState],
          });
        }
      }
    }

    const frequentFoods = [...foodStats.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(({ food, count, quantities, cookStates }) => ({
        food,
        count,
        typicalQuantity: mode(quantities),
        typicalCookState: mode(cookStates),
      }));

    // ── Occasion map (excluding today) ──────────────────────────────────────
    // Key: "YYYY-MM-DD|MEALTYPE" → Map<foodId, { food, quantities[], cookStates[] }>
    const occasions = new Map<string, Map<string, {
      food: object; quantities: number[]; cookStates: string[];
    }>>();

    for (const log of logs) {
      const dateStr = (log.date as Date).toISOString().split('T')[0];
      if (dateStr === today) continue;

      for (const item of log.items) {
        const key = `${dateStr}|${item.mealType}`;
        if (!occasions.has(key)) occasions.set(key, new Map());
        const occ = occasions.get(key)!;
        const ex = occ.get(item.foodId);
        if (ex) {
          ex.quantities.push(item.quantity);
          ex.cookStates.push(item.cookState);
        } else {
          occ.set(item.foodId, {
            food: item.food,
            quantities: [item.quantity],
            cookStates: [item.cookState],
          });
        }
      }
    }

    // ── Meal suggestion ─────────────────────────────────────────────────────
    // Find most common food-set fingerprint for the requested mealType
    const fpMap = new Map<string, {
      items: { food: object; quantities: number[]; cookStates: string[] }[];
      count: number;
    }>();

    for (const [key, occ] of occasions) {
      if (!key.endsWith(`|${mealType}`)) continue;
      const sorted = [...occ.entries()].sort(([a], [b]) => a.localeCompare(b));
      const fp = sorted.map(([id]) => id).join(',');
      const entry = fpMap.get(fp);
      if (entry) {
        entry.count++;
      } else {
        fpMap.set(fp, { items: sorted.map(([, v]) => v), count: 1 });
      }
    }

    let mealSuggestion = null;
    if (fpMap.size > 0) {
      const best = [...fpMap.values()].sort((a, b) => b.count - a.count)[0];
      if (best.count >= 2) {
        const items = best.items.map((v) => ({
          food: v.food,
          quantity: mode(v.quantities),
          cookState: mode(v.cookStates),
        }));
        const totalKcal = Math.round(
          items.reduce((sum, i) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const m = effectiveMacros(i.food as any, i.cookState);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return sum + (m.calories * i.quantity) / (i.food as any).serving;
          }, 0),
        );
        mealSuggestion = { mealType, items, totalKcal };
      }
    }

    // ── Recent meals ────────────────────────────────────────────────────────
    const recentMeals = [...occasions.entries()]
      .sort(([a], [b]) => {
        const [dateA, mtA] = a.split('|');
        const [dateB, mtB] = b.split('|');
        if (dateB !== dateA) return dateB.localeCompare(dateA);
        return (MEAL_RECENCY[mtB] ?? 0) - (MEAL_RECENCY[mtA] ?? 0);
      })
      .slice(0, 5)
      .map(([key, occ]) => {
        const [date, mt] = key.split('|');
        const items = [...occ.values()].map((v) => ({
          food: v.food,
          quantity: mode(v.quantities),
          cookState: mode(v.cookStates),
        }));
        const totalKcal = Math.round(
          items.reduce((sum, i) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const m = effectiveMacros(i.food as any, i.cookState);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return sum + (m.calories * i.quantity) / (i.food as any).serving;
          }, 0),
        );
        return { date, mealType: mt, items, totalKcal };
      });

    return NextResponse.json({ frequentFoods, mealSuggestion, recentMeals });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
