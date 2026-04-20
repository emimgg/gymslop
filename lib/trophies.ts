import { prisma } from './prisma';
import { XP } from './xp';

/** Check and award trophies for a user, return newly unlocked trophy keys */
export async function checkTrophies(userId: string): Promise<string[]> {
  const [
    user,
    workoutCount,
    prCount,
    mealLogCount,
    weightLogCount,
    feelsLogCount,
    allTrophies,
    existingTrophies,
    workoutSessions,
    mealLogItems,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.workoutSession.count({ where: { userId, completedAt: { not: null } } }),
    prisma.workoutSet.count({ where: { session: { userId }, isPR: true } }),
    prisma.mealLog.count({ where: { userId } }),
    prisma.weightLog.count({ where: { userId } }),
    prisma.feelsLog.count({ where: { userId } }),
    prisma.trophy.findMany(),
    prisma.userTrophy.findMany({ where: { userId }, select: { trophyId: true } }),
    prisma.workoutSession.findMany({
      where: { userId, completedAt: { not: null } },
      select: { startedAt: true, completedAt: true },
    }),
    prisma.mealLogItem.findMany({
      where: { mealLog: { userId } },
      select: { quantity: true, food: { select: { calories: true } }, mealLog: { select: { date: true } } },
    }),
  ]);

  if (!user) return [];

  const earned = new Set(existingTrophies.map((t) => t.trophyId));
  const trophyMap = Object.fromEntries(allTrophies.map((t) => [t.key, t]));
  const toUnlock: string[] = [];

  function maybeUnlock(key: string, condition: boolean) {
    const trophy = trophyMap[key];
    if (!trophy || earned.has(trophy.id) || !condition) return;
    toUnlock.push(key);
  }

  // ── Daniel: single session ≥ 120 minutes ─────────────────────────────────
  const danielCondition = workoutSessions.some((s) => {
    if (!s.completedAt) return false;
    return (s.completedAt.getTime() - s.startedAt.getTime()) >= 120 * 60 * 1000;
  });
  maybeUnlock('daniel', danielCondition);

  // ── Uri: 5000+ kcal on two consecutive calendar days ─────────────────────
  const kcalByDate = new Map<string, number>();
  for (const item of mealLogItems) {
    const dateStr = (item.mealLog.date as Date).toISOString().split('T')[0];
    kcalByDate.set(dateStr, (kcalByDate.get(dateStr) ?? 0) + (item.quantity * item.food.calories) / 100);
  }
  const highKcalDates = [...kcalByDate.entries()]
    .filter(([, kcal]) => kcal >= 5000)
    .map(([d]) => d)
    .sort();
  let uriCondition = false;
  for (let i = 1; i < highKcalDates.length; i++) {
    const diff = new Date(highKcalDates[i]).getTime() - new Date(highKcalDates[i - 1]).getTime();
    if (diff === 86_400_000) { uriCondition = true; break; }
  }
  maybeUnlock('uri', uriCondition);

  // ── Justiciero: unobtainable — never unlocked ────────────────────────────

  maybeUnlock('first_workout', workoutCount >= 1);
  maybeUnlock('workouts_10', workoutCount >= 10);
  maybeUnlock('workouts_50', workoutCount >= 50);
  maybeUnlock('workouts_100', workoutCount >= 100);
  maybeUnlock('first_pr', prCount >= 1);
  maybeUnlock('pr_10', prCount >= 10);
  maybeUnlock('first_meal_log', mealLogCount >= 1);
  maybeUnlock('first_weigh_in', weightLogCount >= 1);
  maybeUnlock('first_feels', feelsLogCount >= 1);
  maybeUnlock('streak_7', user.currentStreak >= 7);
  maybeUnlock('streak_30', user.currentStreak >= 30);
  maybeUnlock('streak_100', user.currentStreak >= 100);
  maybeUnlock('level_5', user.level >= 5);
  maybeUnlock('level_10', user.level >= 10);
  maybeUnlock('level_25', user.level >= 25);

  if (toUnlock.length === 0) return [];

  // Award trophies and XP
  let bonusXp = 0;
  for (const key of toUnlock) {
    const trophy = trophyMap[key];
    if (!trophy) continue;
    await prisma.userTrophy.create({
      data: { userId, trophyId: trophy.id },
    });
    bonusXp += trophy.xpReward;
  }

  if (bonusXp > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: bonusXp } },
    });
  }

  return toUnlock;
}

/** Award XP to a user and update level */
export async function awardXp(userId: string, amount: number) {
  const { levelFromXp } = await import('./xp');
  const user = await prisma.user.update({
    where: { id: userId },
    data: { xp: { increment: amount } },
  });
  const newLevel = levelFromXp(user.xp);
  if (newLevel > user.level) {
    await prisma.user.update({
      where: { id: userId },
      data: { level: newLevel },
    });
  }
  return user;
}
