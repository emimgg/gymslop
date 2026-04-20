// ── Types ──────────────────────────────────────────────────────────────────

export type Focus = 'STRENGTH' | 'HYPERTROPHY' | 'BOTH';
export type SplitType = 'FULL_BODY' | 'UPPER_LOWER' | 'ULPPL' | 'PPL' | 'ARNOLD';
export type EquipmentLevel = 'FULL' | 'NO_BARBELL' | 'DUMBBELLS' | 'BODYWEIGHT';

export interface BuilderConfig {
  daysPerWeek: 3 | 4 | 5 | 6;
  splitType: SplitType;
  focus: Focus;
  priorityMuscles: string[];
  equipmentLevel: EquipmentLevel;
}

export interface DBExercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  stretchFocused: boolean;
  isCustom: boolean;
}

export interface GeneratedExercise {
  exerciseId: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  stretchFocused: boolean;
  sets: number;
  repsDisplay: string;
  targetReps: number; // upper bound, used when saving
  order: number;
  isCompound: boolean;
}

export interface GeneratedDay {
  dayOfWeek: number;
  label: string;
  exercises: GeneratedExercise[];
}

export interface MuscleVolume {
  sets: number;
  frequency: number;
  status: 'low' | 'optimal' | 'high';
}

export interface GeneratedRoutine {
  name: string;
  days: GeneratedDay[];
  analytics: Record<string, MuscleVolume>;
}

// ── Equipment availability ─────────────────────────────────────────────────

const ALLOWED_EQUIPMENT: Record<EquipmentLevel, string[]> = {
  FULL:        ['BARBELL', 'DUMBBELL', 'CABLE', 'MACHINE', 'BODYWEIGHT', 'KETTLEBELL', 'BANDS', 'OTHER'],
  NO_BARBELL:  ['DUMBBELL', 'CABLE', 'MACHINE', 'BODYWEIGHT', 'KETTLEBELL', 'BANDS', 'OTHER'],
  DUMBBELLS:   ['DUMBBELL', 'BODYWEIGHT', 'BANDS', 'OTHER'],
  BODYWEIGHT:  ['BODYWEIGHT', 'BANDS', 'OTHER'],
};

// ── Slot definition ────────────────────────────────────────────────────────

interface Slot {
  muscle: string;
  isCompound: boolean;
  sets: number;
  picks: string[]; // ordered priority list of exercise names
}

// ── Exercise pick lists ────────────────────────────────────────────────────
// Earlier in the list = higher priority. Equipment filtering removes entries
// not available. stretchFocused exercises are listed first within each group.

const P = {
  CHEST_COMP:  ['Bench Press', 'Incline Bench Press', 'Incline Dumbbell Press', 'Chest Press Machine', 'Push-Up'],
  CHEST_ISO:   ['Low to High Cable Fly', 'Pec Deck Machine', 'Cable Crossover', 'Dumbbell Fly', 'Push-Up'],
  CHEST_INC:   ['Incline Bench Press', 'Incline Dumbbell Press', 'Bench Press', 'Chest Press Machine', 'Push-Up'],

  BACK_ROW:    ['Barbell Row', 'T-Bar Row', 'Single-Arm Dumbbell Row', 'Seated Cable Row Neutral', 'Seated Cable Row'],
  BACK_PULL:   ['Weighted Pull-Up', 'Pull-Up', 'Lat Pulldown', 'Chin-Up'],
  BACK_PULL2:  ['Pull-Up', 'Weighted Pull-Up', 'Lat Pulldown', 'Chin-Up'],
  BACK_DEAD:   ['Deadlift'],
  BACK_ISO:    ['Cable Pullover', 'Seated Cable Row Neutral', 'Seated Cable Row', 'Single-Arm Dumbbell Row', 'Lat Pulldown'],

  SHOULDER_COMP: ['Overhead Press (OHP)', 'Dumbbell Shoulder Press', 'Arnold Press'],
  SHOULDER_ISO:  ['Cable Lateral Raise', 'Face Pull', 'Lateral Raise', 'Front Raise', 'Rear Delt Fly'],

  BICEPS_ISO:  ['Bayesian Cable Curl', 'Incline Dumbbell Curl', 'Preacher Curl', 'Cable Curl', 'Low Pulley Cable Curl', 'Dumbbell Curl', 'Hammer Curl', 'Barbell Curl'],
  BICEPS_ISO2: ['Incline Dumbbell Curl', 'Bayesian Cable Curl', 'Low Pulley Cable Curl', 'Preacher Curl', 'Hammer Curl', 'Dumbbell Curl', 'Barbell Curl'],

  TRICEPS_ISO:  ['Overhead Cable Tricep Extension', 'Cable Rope Tricep Extension', 'Tricep Pushdown', 'Skull Crusher', 'Close-Grip Bench Press', 'Overhead Tricep Extension', 'Tricep Dips'],
  TRICEPS_ISO2: ['Cable Rope Tricep Extension', 'Overhead Cable Tricep Extension', 'Tricep Pushdown', 'Close-Grip Bench Press', 'Skull Crusher', 'Overhead Tricep Extension', 'Tricep Dips'],

  QUADS_COMP:  ['Squat', 'Hack Squat', 'Leg Press', 'Front Squat', 'Bulgarian Split Squat'],
  QUADS_HACK:  ['Hack Squat', 'Squat', 'Leg Press', 'Front Squat', 'Bulgarian Split Squat'],
  QUADS_ISO:   ['Leg Extension', 'Leg Press', 'Hack Squat', 'Walking Lunges'],
  QUADS_PRESS: ['Leg Press', 'Hack Squat', 'Bulgarian Split Squat', 'Walking Lunges'],

  HAMSTRING_COMP: ['Romanian Deadlift (RDL)', 'Stiff-Leg Deadlift', 'Deadlift'],
  HAMSTRING_ISO:  ['Seated Leg Curl', 'Leg Curl'],

  GLUTES_COMP: ['Hip Thrust', 'Machine Hip Thrust', 'Glute Bridge'],
  GLUTES_ISO:  ['Machine Hip Thrust', 'Hip Thrust', 'Cable Kickback', 'Machine Hip Abduction', 'Glute Bridge'],

  CALVES_ISO:  ['Calf Raise on Leg Press', 'Standing Calf Raise'],
  CORE_ISO:    ['Machine Crunch', 'Cable Crunch', 'Hanging Leg Raise', 'Plank', 'Russian Twist'],
};

// ── Day templates ──────────────────────────────────────────────────────────

const FULL_BODY: Slot[] = [
  { muscle: 'QUADS',      isCompound: true,  sets: 4, picks: P.QUADS_COMP },
  { muscle: 'CHEST',      isCompound: true,  sets: 4, picks: P.CHEST_COMP },
  { muscle: 'BACK',       isCompound: true,  sets: 3, picks: P.BACK_ROW },
  { muscle: 'BACK',       isCompound: true,  sets: 3, picks: P.BACK_PULL },
  { muscle: 'SHOULDERS',  isCompound: true,  sets: 3, picks: P.SHOULDER_COMP },
  { muscle: 'HAMSTRINGS', isCompound: false, sets: 3, picks: P.HAMSTRING_COMP },
  { muscle: 'BICEPS',     isCompound: false, sets: 3, picks: P.BICEPS_ISO },
  { muscle: 'TRICEPS',    isCompound: false, sets: 3, picks: P.TRICEPS_ISO },
];

const UPPER_A: Slot[] = [
  { muscle: 'CHEST',     isCompound: true,  sets: 4, picks: P.CHEST_COMP },
  { muscle: 'BACK',      isCompound: true,  sets: 4, picks: P.BACK_ROW },
  { muscle: 'SHOULDERS', isCompound: true,  sets: 3, picks: P.SHOULDER_COMP },
  { muscle: 'BACK',      isCompound: true,  sets: 3, picks: P.BACK_PULL },
  { muscle: 'BICEPS',    isCompound: false, sets: 3, picks: P.BICEPS_ISO },
  { muscle: 'TRICEPS',   isCompound: false, sets: 3, picks: P.TRICEPS_ISO },
];

const UPPER_B: Slot[] = [
  { muscle: 'CHEST',     isCompound: true,  sets: 3, picks: P.CHEST_INC },
  { muscle: 'CHEST',     isCompound: false, sets: 3, picks: P.CHEST_ISO },
  { muscle: 'BACK',      isCompound: true,  sets: 3, picks: P.BACK_PULL2 },
  { muscle: 'BACK',      isCompound: false, sets: 3, picks: P.BACK_ISO },
  { muscle: 'SHOULDERS', isCompound: false, sets: 3, picks: P.SHOULDER_ISO },
  { muscle: 'BICEPS',    isCompound: false, sets: 3, picks: P.BICEPS_ISO2 },
  { muscle: 'TRICEPS',   isCompound: false, sets: 3, picks: P.TRICEPS_ISO2 },
];

const LOWER_A: Slot[] = [
  { muscle: 'QUADS',      isCompound: true,  sets: 4, picks: P.QUADS_COMP },
  { muscle: 'HAMSTRINGS', isCompound: true,  sets: 3, picks: P.HAMSTRING_COMP },
  { muscle: 'QUADS',      isCompound: false, sets: 3, picks: P.QUADS_PRESS },
  { muscle: 'HAMSTRINGS', isCompound: false, sets: 3, picks: P.HAMSTRING_ISO },
  { muscle: 'GLUTES',     isCompound: true,  sets: 3, picks: P.GLUTES_COMP },
  { muscle: 'CALVES',     isCompound: false, sets: 4, picks: P.CALVES_ISO },
];

const LOWER_B: Slot[] = [
  { muscle: 'QUADS',      isCompound: true,  sets: 4, picks: P.QUADS_HACK },
  { muscle: 'HAMSTRINGS', isCompound: true,  sets: 3, picks: P.HAMSTRING_COMP },
  { muscle: 'QUADS',      isCompound: false, sets: 3, picks: P.QUADS_ISO },
  { muscle: 'HAMSTRINGS', isCompound: false, sets: 3, picks: P.HAMSTRING_ISO },
  { muscle: 'GLUTES',     isCompound: false, sets: 3, picks: P.GLUTES_ISO },
  { muscle: 'CORE',       isCompound: false, sets: 3, picks: P.CORE_ISO },
  { muscle: 'CALVES',     isCompound: false, sets: 4, picks: P.CALVES_ISO },
];

const UPPER_STRENGTH: Slot[] = [
  { muscle: 'CHEST',     isCompound: true,  sets: 4, picks: P.CHEST_COMP },
  { muscle: 'BACK',      isCompound: true,  sets: 4, picks: P.BACK_ROW },
  { muscle: 'SHOULDERS', isCompound: true,  sets: 3, picks: P.SHOULDER_COMP },
  { muscle: 'BACK',      isCompound: true,  sets: 3, picks: P.BACK_PULL },
  { muscle: 'BICEPS',    isCompound: false, sets: 2, picks: P.BICEPS_ISO },
  { muscle: 'TRICEPS',   isCompound: false, sets: 2, picks: P.TRICEPS_ISO },
];

const LOWER_STRENGTH: Slot[] = [
  { muscle: 'QUADS',      isCompound: true, sets: 4, picks: P.QUADS_COMP },
  { muscle: 'BACK',       isCompound: true, sets: 3, picks: P.BACK_DEAD },
  { muscle: 'HAMSTRINGS', isCompound: true, sets: 3, picks: P.HAMSTRING_COMP },
  { muscle: 'QUADS',      isCompound: false, sets: 2, picks: P.QUADS_PRESS },
  { muscle: 'HAMSTRINGS', isCompound: false, sets: 2, picks: P.HAMSTRING_ISO },
];

const PUSH_HYPERTROPHY: Slot[] = [
  { muscle: 'CHEST',     isCompound: true,  sets: 4, picks: P.CHEST_INC },
  { muscle: 'SHOULDERS', isCompound: true,  sets: 3, picks: P.SHOULDER_COMP },
  { muscle: 'CHEST',     isCompound: false, sets: 3, picks: P.CHEST_ISO },
  { muscle: 'SHOULDERS', isCompound: false, sets: 3, picks: P.SHOULDER_ISO },
  { muscle: 'TRICEPS',   isCompound: false, sets: 3, picks: P.TRICEPS_ISO },
  { muscle: 'TRICEPS',   isCompound: false, sets: 3, picks: P.TRICEPS_ISO2 },
];

const PULL_HYPERTROPHY: Slot[] = [
  { muscle: 'BACK',      isCompound: true,  sets: 4, picks: P.BACK_PULL2 },
  { muscle: 'BACK',      isCompound: false, sets: 3, picks: P.BACK_ISO },
  { muscle: 'BACK',      isCompound: false, sets: 3, picks: [...P.BACK_ISO].reverse() },
  { muscle: 'SHOULDERS', isCompound: false, sets: 3, picks: ['Face Pull', 'Cable Lateral Raise', 'Rear Delt Fly', 'Lateral Raise'] },
  { muscle: 'BICEPS',    isCompound: false, sets: 3, picks: P.BICEPS_ISO },
  { muscle: 'BICEPS',    isCompound: false, sets: 3, picks: P.BICEPS_ISO2 },
];

const LEGS_HYPERTROPHY: Slot[] = [
  { muscle: 'QUADS',      isCompound: true,  sets: 4, picks: P.QUADS_HACK },
  { muscle: 'HAMSTRINGS', isCompound: true,  sets: 3, picks: P.HAMSTRING_COMP },
  { muscle: 'QUADS',      isCompound: false, sets: 3, picks: P.QUADS_PRESS },
  { muscle: 'QUADS',      isCompound: false, sets: 3, picks: P.QUADS_ISO },
  { muscle: 'HAMSTRINGS', isCompound: false, sets: 3, picks: P.HAMSTRING_ISO },
  { muscle: 'GLUTES',     isCompound: true,  sets: 3, picks: P.GLUTES_COMP },
  { muscle: 'CALVES',     isCompound: false, sets: 4, picks: P.CALVES_ISO },
];

const PUSH_A: Slot[] = [
  { muscle: 'CHEST',     isCompound: true,  sets: 4, picks: P.CHEST_COMP },
  { muscle: 'CHEST',     isCompound: true,  sets: 3, picks: P.CHEST_INC },
  { muscle: 'SHOULDERS', isCompound: true,  sets: 3, picks: P.SHOULDER_COMP },
  { muscle: 'CHEST',     isCompound: false, sets: 3, picks: P.CHEST_ISO },
  { muscle: 'SHOULDERS', isCompound: false, sets: 3, picks: P.SHOULDER_ISO },
  { muscle: 'TRICEPS',   isCompound: false, sets: 3, picks: P.TRICEPS_ISO },
  { muscle: 'TRICEPS',   isCompound: false, sets: 3, picks: P.TRICEPS_ISO2 },
];

const PUSH_B: Slot[] = [
  { muscle: 'CHEST',     isCompound: true,  sets: 4, picks: P.CHEST_INC },
  { muscle: 'CHEST',     isCompound: true,  sets: 3, picks: P.CHEST_COMP },
  { muscle: 'SHOULDERS', isCompound: true,  sets: 3, picks: P.SHOULDER_COMP },
  { muscle: 'CHEST',     isCompound: false, sets: 3, picks: P.CHEST_ISO },
  { muscle: 'SHOULDERS', isCompound: false, sets: 3, picks: P.SHOULDER_ISO },
  { muscle: 'TRICEPS',   isCompound: false, sets: 3, picks: P.TRICEPS_ISO2 },
  { muscle: 'TRICEPS',   isCompound: false, sets: 3, picks: P.TRICEPS_ISO },
];

const PULL_A: Slot[] = [
  { muscle: 'BACK',      isCompound: true,  sets: 3, picks: P.BACK_DEAD },
  { muscle: 'BACK',      isCompound: true,  sets: 4, picks: P.BACK_ROW },
  { muscle: 'BACK',      isCompound: true,  sets: 3, picks: P.BACK_PULL },
  { muscle: 'BACK',      isCompound: false, sets: 3, picks: P.BACK_ISO },
  { muscle: 'BICEPS',    isCompound: false, sets: 3, picks: P.BICEPS_ISO },
  { muscle: 'BICEPS',    isCompound: false, sets: 3, picks: P.BICEPS_ISO2 },
  { muscle: 'SHOULDERS', isCompound: false, sets: 3, picks: ['Face Pull', 'Rear Delt Fly', 'Cable Lateral Raise'] },
];

const PULL_B: Slot[] = [
  { muscle: 'BACK',      isCompound: true,  sets: 3, picks: P.BACK_DEAD },
  { muscle: 'BACK',      isCompound: true,  sets: 4, picks: P.BACK_PULL2 },
  { muscle: 'BACK',      isCompound: false, sets: 3, picks: P.BACK_ISO },
  { muscle: 'BACK',      isCompound: false, sets: 3, picks: [...P.BACK_ISO].reverse() },
  { muscle: 'BICEPS',    isCompound: false, sets: 3, picks: P.BICEPS_ISO2 },
  { muscle: 'BICEPS',    isCompound: false, sets: 3, picks: P.BICEPS_ISO },
  { muscle: 'SHOULDERS', isCompound: false, sets: 3, picks: ['Face Pull', 'Rear Delt Fly', 'Cable Lateral Raise'] },
];

const LEGS_A: Slot[] = [
  { muscle: 'QUADS',      isCompound: true,  sets: 4, picks: P.QUADS_COMP },
  { muscle: 'HAMSTRINGS', isCompound: true,  sets: 3, picks: P.HAMSTRING_COMP },
  { muscle: 'QUADS',      isCompound: false, sets: 3, picks: P.QUADS_PRESS },
  { muscle: 'QUADS',      isCompound: false, sets: 3, picks: P.QUADS_ISO },
  { muscle: 'HAMSTRINGS', isCompound: false, sets: 3, picks: P.HAMSTRING_ISO },
  { muscle: 'GLUTES',     isCompound: true,  sets: 3, picks: P.GLUTES_COMP },
  { muscle: 'CALVES',     isCompound: false, sets: 4, picks: P.CALVES_ISO },
];

const LEGS_B: Slot[] = [
  { muscle: 'QUADS',      isCompound: true,  sets: 4, picks: P.QUADS_HACK },
  { muscle: 'HAMSTRINGS', isCompound: true,  sets: 3, picks: P.HAMSTRING_COMP },
  { muscle: 'QUADS',      isCompound: false, sets: 3, picks: P.QUADS_ISO },
  { muscle: 'QUADS',      isCompound: false, sets: 3, picks: P.QUADS_PRESS },
  { muscle: 'HAMSTRINGS', isCompound: false, sets: 3, picks: P.HAMSTRING_ISO },
  { muscle: 'GLUTES',     isCompound: false, sets: 3, picks: P.GLUTES_ISO },
  { muscle: 'CALVES',     isCompound: false, sets: 4, picks: P.CALVES_ISO },
];

const ARNOLD_CB: Slot[] = [
  { muscle: 'CHEST', isCompound: true,  sets: 4, picks: P.CHEST_COMP },
  { muscle: 'BACK',  isCompound: true,  sets: 4, picks: P.BACK_ROW },
  { muscle: 'CHEST', isCompound: true,  sets: 3, picks: P.CHEST_INC },
  { muscle: 'BACK',  isCompound: true,  sets: 3, picks: P.BACK_PULL },
  { muscle: 'CHEST', isCompound: false, sets: 3, picks: P.CHEST_ISO },
  { muscle: 'BACK',  isCompound: false, sets: 3, picks: P.BACK_ISO },
];

const ARNOLD_SA: Slot[] = [
  { muscle: 'SHOULDERS', isCompound: true,  sets: 4, picks: P.SHOULDER_COMP },
  { muscle: 'BICEPS',    isCompound: false, sets: 4, picks: P.BICEPS_ISO },
  { muscle: 'SHOULDERS', isCompound: true,  sets: 3, picks: P.SHOULDER_COMP },
  { muscle: 'TRICEPS',   isCompound: false, sets: 3, picks: P.TRICEPS_ISO },
  { muscle: 'SHOULDERS', isCompound: false, sets: 3, picks: P.SHOULDER_ISO },
  { muscle: 'BICEPS',    isCompound: false, sets: 3, picks: P.BICEPS_ISO2 },
];

// ── Split day definitions ──────────────────────────────────────────────────

interface DayDef { dayOfWeek: number; label: string; slots: Slot[]; }

function getSplitDays(config: BuilderConfig): DayDef[] {
  switch (config.splitType) {
    case 'FULL_BODY':
      return [
        { dayOfWeek: 1, label: 'Full Body', slots: FULL_BODY },
        { dayOfWeek: 3, label: 'Full Body', slots: FULL_BODY },
        { dayOfWeek: 5, label: 'Full Body', slots: FULL_BODY },
      ];
    case 'UPPER_LOWER':
      return [
        { dayOfWeek: 1, label: 'Upper A', slots: UPPER_A },
        { dayOfWeek: 2, label: 'Lower A', slots: LOWER_A },
        { dayOfWeek: 4, label: 'Upper B', slots: UPPER_B },
        { dayOfWeek: 5, label: 'Lower B', slots: LOWER_B },
      ];
    case 'ULPPL':
      return [
        { dayOfWeek: 1, label: 'Upper Strength', slots: UPPER_STRENGTH },
        { dayOfWeek: 2, label: 'Lower Strength', slots: LOWER_STRENGTH },
        { dayOfWeek: 3, label: 'Push Hypertrophy', slots: PUSH_HYPERTROPHY },
        { dayOfWeek: 4, label: 'Pull Hypertrophy', slots: PULL_HYPERTROPHY },
        { dayOfWeek: 5, label: 'Legs Hypertrophy', slots: LEGS_HYPERTROPHY },
      ];
    case 'PPL':
      return [
        { dayOfWeek: 1, label: 'Push A', slots: PUSH_A },
        { dayOfWeek: 2, label: 'Pull A', slots: PULL_A },
        { dayOfWeek: 3, label: 'Legs A', slots: LEGS_A },
        { dayOfWeek: 4, label: 'Push B', slots: PUSH_B },
        { dayOfWeek: 5, label: 'Pull B', slots: PULL_B },
        { dayOfWeek: 6, label: 'Legs B', slots: LEGS_B },
      ];
    case 'ARNOLD':
      return [
        { dayOfWeek: 1, label: 'Chest + Back', slots: ARNOLD_CB },
        { dayOfWeek: 2, label: 'Shoulders + Arms', slots: ARNOLD_SA },
        { dayOfWeek: 3, label: 'Legs', slots: LEGS_A },
        { dayOfWeek: 4, label: 'Chest + Back', slots: ARNOLD_CB },
        { dayOfWeek: 5, label: 'Shoulders + Arms', slots: ARNOLD_SA },
        { dayOfWeek: 6, label: 'Legs', slots: LEGS_B },
      ];
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function buildExerciseMap(
  exercises: DBExercise[],
  equipmentLevel: EquipmentLevel,
): Map<string, DBExercise> {
  const allowed = new Set(ALLOWED_EQUIPMENT[equipmentLevel]);
  const map = new Map<string, DBExercise>();
  for (const ex of exercises) {
    if (!ex.isCustom && allowed.has(ex.equipment)) {
      map.set(ex.name, ex);
    }
  }
  return map;
}

function pickFrom(
  picks: string[],
  exMap: Map<string, DBExercise>,
  usedNames: Set<string>,
): DBExercise | null {
  for (const name of picks) {
    const ex = exMap.get(name);
    if (ex && !usedNames.has(ex.name)) {
      usedNames.add(ex.name);
      return ex;
    }
  }
  // Fallback: allow reuse if no unique option
  for (const name of picks) {
    const ex = exMap.get(name);
    if (ex) return ex;
  }
  return null;
}

function repsForSlot(isCompound: boolean, focus: Focus, dayLabel: string): { display: string; target: number } {
  // Strength-label days use strength reps regardless of global focus
  const isStrengthDay = dayLabel.toLowerCase().includes('strength');
  const effectiveFocus: Focus = isStrengthDay ? 'STRENGTH' : focus;

  if (effectiveFocus === 'STRENGTH') {
    return isCompound
      ? { display: '3-5', target: 5 }
      : { display: '6-8', target: 8 };
  }
  if (effectiveFocus === 'HYPERTROPHY') {
    return isCompound
      ? { display: '6-10', target: 10 }
      : { display: '10-15', target: 15 };
  }
  // BOTH
  return isCompound
    ? { display: '4-6', target: 6 }
    : { display: '8-12', target: 12 };
}

const PRIORITY_MUSCLE_MAP: Record<string, string[]> = {
  CHEST:     ['CHEST'],
  BACK:      ['BACK'],
  SHOULDERS: ['SHOULDERS'],
  ARMS:      ['BICEPS', 'TRICEPS'],
  LEGS:      ['QUADS', 'HAMSTRINGS', 'CALVES'],
  GLUTES:    ['GLUTES'],
  CORE:      ['CORE'],
};

function isPriorityMuscle(muscle: string, priorityMuscles: string[]): boolean {
  return priorityMuscles.some((pm) =>
    PRIORITY_MUSCLE_MAP[pm]?.includes(muscle) ?? false,
  );
}

function computeAnalytics(days: GeneratedDay[]): Record<string, MuscleVolume> {
  const setsMap: Record<string, number> = {};
  const freqMap: Record<string, number> = {};

  for (const day of days) {
    const seen = new Set<string>();
    for (const ex of day.exercises) {
      const mg = ex.muscleGroup;
      setsMap[mg] = (setsMap[mg] ?? 0) + ex.sets;
      if (!seen.has(mg)) {
        freqMap[mg] = (freqMap[mg] ?? 0) + 1;
        seen.add(mg);
      }
    }
  }

  const result: Record<string, MuscleVolume> = {};
  for (const muscle of Object.keys(setsMap)) {
    const sets = setsMap[muscle];
    result[muscle] = {
      sets,
      frequency: freqMap[muscle] ?? 0,
      status: sets < 10 ? 'low' : sets > 22 ? 'high' : 'optimal',
    };
  }
  return result;
}

const SPLIT_NAMES: Record<SplitType, string> = {
  FULL_BODY:   'Full Body',
  UPPER_LOWER: 'Upper/Lower',
  ULPPL:       'ULPPL',
  PPL:         'PPL',
  ARNOLD:      'Arnold Split',
};

// ── Main generate function ─────────────────────────────────────────────────

export function generateRoutine(
  config: BuilderConfig,
  exercises: DBExercise[],
): GeneratedRoutine {
  const exMap = buildExerciseMap(exercises, config.equipmentLevel);
  const splitDays = getSplitDays(config);
  const generatedDays: GeneratedDay[] = [];

  for (const dayDef of splitDays) {
    const usedNames = new Set<string>();
    const generatedExercises: GeneratedExercise[] = [];

    for (const slot of dayDef.slots) {
      const ex = pickFrom(slot.picks, exMap, usedNames);
      if (!ex) continue;

      const bonus = isPriorityMuscle(slot.muscle, config.priorityMuscles) ? 1 : 0;
      const sets = slot.sets + bonus;
      const reps = repsForSlot(slot.isCompound, config.focus, dayDef.label);

      generatedExercises.push({
        exerciseId: ex.id,
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        equipment: ex.equipment,
        stretchFocused: ex.stretchFocused,
        sets,
        repsDisplay: reps.display,
        targetReps: reps.target,
        order: generatedExercises.length,
        isCompound: slot.isCompound,
      });
    }

    generatedDays.push({
      dayOfWeek: dayDef.dayOfWeek,
      label: dayDef.label,
      exercises: generatedExercises,
    });
  }

  return {
    name: SPLIT_NAMES[config.splitType],
    days: generatedDays,
    analytics: computeAnalytics(generatedDays),
  };
}

// ── Exercise swap alternatives ─────────────────────────────────────────────

export function getAlternatives(
  targetExercise: GeneratedExercise,
  exercises: DBExercise[],
  equipmentLevel: EquipmentLevel,
  usedIds: Set<string>,
): DBExercise[] {
  const allowed = new Set(ALLOWED_EQUIPMENT[equipmentLevel]);
  return exercises
    .filter(
      (ex) =>
        !ex.isCustom &&
        allowed.has(ex.equipment) &&
        ex.muscleGroup === targetExercise.muscleGroup &&
        ex.id !== targetExercise.exerciseId,
    )
    .sort((a, b) => {
      // Stretch-focused first
      if (a.stretchFocused !== b.stretchFocused) return b.stretchFocused ? 1 : -1;
      // Already used = push to end
      const aUsed = usedIds.has(a.id) ? 1 : 0;
      const bUsed = usedIds.has(b.id) ? 1 : 0;
      if (aUsed !== bUsed) return aUsed - bUsed;
      // Cable/Machine > Dumbbell > Barbell
      const prio: Record<string, number> = { CABLE: 0, MACHINE: 1, DUMBBELL: 2, BODYWEIGHT: 3, BARBELL: 4 };
      return (prio[a.equipment] ?? 5) - (prio[b.equipment] ?? 5);
    });
}
