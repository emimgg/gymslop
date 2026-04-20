/** XP thresholds & leveling logic */

export const XP_PER_LEVEL_BASE = 200;
export const XP_LEVEL_MULTIPLIER = 1.5;

/** Total XP required to reach `level` */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(XP_PER_LEVEL_BASE * Math.pow(XP_LEVEL_MULTIPLIER, level - 2));
}

/** Total cumulative XP needed to have reached `level` */
export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 2; i <= level; i++) total += xpForLevel(i);
  return total;
}

/** Level derived from total XP */
export function levelFromXp(xp: number): number {
  let level = 1;
  while (totalXpForLevel(level + 1) <= xp) level++;
  return level;
}

/** XP needed for next level */
export function xpToNextLevel(currentXp: number): { current: number; needed: number; percent: number } {
  const level = levelFromXp(currentXp);
  const thisLevelXp = totalXpForLevel(level);
  const nextLevelXp = totalXpForLevel(level + 1);
  const needed = nextLevelXp - thisLevelXp;
  const current = currentXp - thisLevelXp;
  return { current, needed, percent: Math.min(100, Math.floor((current / needed) * 100)) };
}

/** XP rewards */
export const XP = {
  WORKOUT_COMPLETE: 100,
  PR_BROKEN: 50,
  MEAL_LOG: 20,
  CALORIE_GOAL: 50,
  PROTEIN_GOAL: 30,
  WEIGHT_LOG: 15,
  FEELS_LOG: 25,
  STREAK_BONUS: 10, // per streak day (capped at 100)
  TROPHY_UNLOCK: 50,
};

export function streakBonus(streak: number): number {
  return Math.min(streak * XP.STREAK_BONUS, 100);
}

/** Level title labels */
export function levelTitle(level: number): string {
  if (level < 5) return 'Newbie';
  if (level < 10) return 'Trainee';
  if (level < 15) return 'Regular';
  if (level < 20) return 'Athlete';
  if (level < 30) return 'Veteran';
  if (level < 40) return 'Expert';
  if (level < 50) return 'Master';
  return 'Legend';
}
