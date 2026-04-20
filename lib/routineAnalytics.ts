import { MG_CONFIG } from './muscleGroupConfig';

export interface AnalyticsExercise {
  muscleGroup: string;
  sets: number;
}

export interface AnalyticsDay {
  dayOfWeek: number;
  exercises: AnalyticsExercise[];
}

export interface DaySummary {
  totalExercises: number;
  totalSets: number;
  estDurationMin: number;
  muscles: string[];
}

export interface MgStats {
  mg: string;
  totalSets: number;
  frequency: number;
  dayOfWeeks: number[];
}

export interface HeatmapData {
  activeDays: number[];
  rows: { mg: string; cells: number[] }[];
}

export function computeDaySummary(exercises: AnalyticsExercise[]): DaySummary {
  const totalSets = exercises.reduce((sum, e) => sum + e.sets, 0);
  const seenMg = new Map<string, boolean>();
  for (const ex of exercises) seenMg.set(ex.muscleGroup, true);
  const muscles = [...seenMg.keys()].sort(
    (a, b) => (MG_CONFIG[a]?.order ?? 99) - (MG_CONFIG[b]?.order ?? 99),
  );
  return {
    totalExercises: exercises.length,
    totalSets,
    estDurationMin: Math.round(totalSets * 3),
    muscles,
  };
}

export function computeWeeklyStats(days: AnalyticsDay[]): MgStats[] {
  const map: Record<string, { totalSets: number; dayOfWeeks: Set<number> }> = {};
  for (const day of days) {
    for (const ex of day.exercises) {
      if (!map[ex.muscleGroup]) map[ex.muscleGroup] = { totalSets: 0, dayOfWeeks: new Set() };
      map[ex.muscleGroup].totalSets += ex.sets;
      map[ex.muscleGroup].dayOfWeeks.add(day.dayOfWeek);
    }
  }
  return Object.entries(map)
    .map(([mg, { totalSets, dayOfWeeks }]) => ({
      mg,
      totalSets,
      frequency: dayOfWeeks.size,
      dayOfWeeks: [...dayOfWeeks].sort(),
    }))
    .sort((a, b) => (MG_CONFIG[a.mg]?.order ?? 99) - (MG_CONFIG[b.mg]?.order ?? 99));
}

export function computeHeatmap(days: AnalyticsDay[]): HeatmapData {
  const activeDays = [...new Set(days.map((d) => d.dayOfWeek))].sort();
  const mgSet = new Set<string>();
  for (const day of days) for (const ex of day.exercises) mgSet.add(ex.muscleGroup);
  const muscles = [...mgSet].sort(
    (a, b) => (MG_CONFIG[a]?.order ?? 99) - (MG_CONFIG[b]?.order ?? 99),
  );
  const rows = muscles.map((mg) => ({
    mg,
    cells: activeDays.map((dow) => {
      const day = days.find((d) => d.dayOfWeek === dow);
      if (!day) return 0;
      return day.exercises.filter((e) => e.muscleGroup === mg).reduce((s, e) => s + e.sets, 0);
    }),
  }));
  return { activeDays, rows };
}
