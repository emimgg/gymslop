import { PrismaClient, MuscleGroup, Equipment } from '@prisma/client';

const prisma = new PrismaClient();

type TEx = { name: string; sets: number; reps: string };
type TDay = { dayOfWeek: number; label: string; exercises: TEx[] };
type TTemplate = {
  name: string; description: string; daysPerWeek: number; difficulty: string; days: TDay[];
};

// ─── Shared day blocks ────────────────────────────────────────────────────────

const PUSH_DAY: TEx[] = [
  { name: 'Bench Press',                      sets: 4, reps: '6'  },
  { name: 'Incline Bench Press',              sets: 3, reps: '8'  },
  { name: 'Overhead Press (OHP)',             sets: 3, reps: '8'  },
  { name: 'Low to High Cable Fly',            sets: 3, reps: '12' },
  { name: 'Overhead Cable Tricep Extension',  sets: 3, reps: '12' },
  { name: 'Cable Rope Tricep Extension',      sets: 3, reps: '15' },
];

// Deadlift removed (back/posterior chain belongs on Lower/Leg days only)
// Cable Pullover removed to keep BACK ≤ 24 sets/week on PPL (2× per week)
const PULL_DAY: TEx[] = [
  { name: 'Pull-Up',               sets: 4, reps: '8'  },
  { name: 'Barbell Row',           sets: 4, reps: '6'  },
  { name: 'Lat Pulldown',          sets: 3, reps: '10' },
  { name: 'Bayesian Cable Curl',   sets: 3, reps: '10' },
  { name: 'Incline Dumbbell Curl', sets: 3, reps: '12' },
  { name: 'Face Pull',             sets: 3, reps: '15' },
];

const LEGS_DAY: TEx[] = [
  { name: 'Squat',                    sets: 4, reps: '6'  },
  { name: 'Leg Press',               sets: 3, reps: '10' },
  { name: 'Romanian Deadlift (RDL)', sets: 3, reps: '8'  },
  { name: 'Leg Extension',           sets: 3, reps: '12' },
  { name: 'Seated Leg Curl',         sets: 3, reps: '12' },
  { name: 'Hip Thrust',              sets: 3, reps: '12' },
  { name: 'Standing Calf Raise',     sets: 4, reps: '15' },
];

const FULL_BODY_DAY: TEx[] = [
  { name: 'Squat',               sets: 3, reps: '5' },
  { name: 'Bench Press',         sets: 3, reps: '5' },
  { name: 'Barbell Row',         sets: 3, reps: '5' },
  { name: 'Overhead Press (OHP)', sets: 3, reps: '8' },
  { name: 'Deadlift',            sets: 1, reps: '5' },
];

const ARNOLD_CHEST_BACK: TEx[] = [
  { name: 'Bench Press',          sets: 4, reps: '8'  },
  { name: 'Barbell Row',          sets: 4, reps: '8'  },
  { name: 'Incline Bench Press',  sets: 3, reps: '10' },
  { name: 'Pull-Up',              sets: 3, reps: '8'  },
  { name: 'Low to High Cable Fly', sets: 3, reps: '12' },
  { name: 'Cable Pullover',       sets: 3, reps: '12' },
];

const ARNOLD_SHOULDERS_ARMS: TEx[] = [
  { name: 'Overhead Press (OHP)',           sets: 4, reps: '8'  },
  { name: 'Bayesian Cable Curl',            sets: 4, reps: '10' },
  { name: 'Arnold Press',                   sets: 3, reps: '10' },
  { name: 'Close-Grip Bench Press',         sets: 3, reps: '10' },
  { name: 'Cable Lateral Raise',            sets: 3, reps: '12' },
  { name: 'Incline Dumbbell Curl',          sets: 3, reps: '12' },
];

const ARNOLD_LEGS: TEx[] = [
  { name: 'Squat',                    sets: 4, reps: '6'  },
  { name: 'Romanian Deadlift (RDL)', sets: 3, reps: '8'  },
  { name: 'Leg Press',               sets: 3, reps: '10' },
  { name: 'Hip Thrust',              sets: 3, reps: '12' },
  { name: 'Seated Leg Curl',         sets: 3, reps: '12' },
  { name: 'Standing Calf Raise',     sets: 4, reps: '15' },
];

// ─── Templates ────────────────────────────────────────────────────────────────

const TEMPLATES: TTemplate[] = [
  {
    name: 'Full Body',
    description: 'Compound movements three days a week — ideal for building a solid strength foundation.',
    daysPerWeek: 3,
    difficulty: 'Beginner',
    days: [
      { dayOfWeek: 1, label: 'Full Body', exercises: FULL_BODY_DAY },
      { dayOfWeek: 3, label: 'Full Body', exercises: FULL_BODY_DAY },
      { dayOfWeek: 5, label: 'Full Body', exercises: FULL_BODY_DAY },
    ],
  },
  {
    name: 'Upper/Lower',
    description: '4-day split alternating upper and lower body — balances strength and hypertrophy.',
    daysPerWeek: 4,
    difficulty: 'Intermediate',
    days: [
      { dayOfWeek: 1, label: 'Upper A', exercises: [
        { name: 'Bench Press',                      sets: 4, reps: '6'  },
        { name: 'Barbell Row',                      sets: 4, reps: '6'  },
        { name: 'Overhead Press (OHP)',             sets: 3, reps: '8'  },
        { name: 'Pull-Up',                          sets: 3, reps: '8'  },
        { name: 'Bayesian Cable Curl',              sets: 3, reps: '10' },
        { name: 'Overhead Cable Tricep Extension',  sets: 3, reps: '10' },
      ]},
      { dayOfWeek: 2, label: 'Lower A', exercises: [
        { name: 'Squat',                    sets: 4, reps: '6'  },
        { name: 'Romanian Deadlift (RDL)', sets: 3, reps: '8'  },
        { name: 'Leg Press',               sets: 3, reps: '10' },
        { name: 'Seated Leg Curl',         sets: 3, reps: '10' },
        { name: 'Standing Calf Raise',     sets: 4, reps: '12' },
      ]},
      { dayOfWeek: 4, label: 'Upper B', exercises: [
        { name: 'Incline Bench Press',    sets: 4, reps: '8'  },
        { name: 'Single-Arm Dumbbell Row', sets: 4, reps: '8' },
        { name: 'Low to High Cable Fly',  sets: 3, reps: '12' },
        { name: 'Lat Pulldown',           sets: 3, reps: '10' },
        { name: 'Incline Dumbbell Curl',  sets: 3, reps: '12' },
        { name: 'Cable Rope Tricep Extension', sets: 3, reps: '12' },
      ]},
      { dayOfWeek: 5, label: 'Lower B', exercises: [
        { name: 'Deadlift',                sets: 4, reps: '5'  },
        { name: 'Bulgarian Split Squat',   sets: 3, reps: '10' },
        { name: 'Hip Thrust',              sets: 3, reps: '12' },
        { name: 'Leg Extension',           sets: 3, reps: '12' },
        { name: 'Seated Leg Curl',         sets: 3, reps: '12' },
      ]},
    ],
  },
  {
    name: 'PPL',
    description: 'Push/Pull/Legs 6-day split — one of the most balanced and proven hypertrophy programs.',
    daysPerWeek: 6,
    difficulty: 'Intermediate',
    days: [
      { dayOfWeek: 1, label: 'Push', exercises: PUSH_DAY },
      { dayOfWeek: 2, label: 'Pull', exercises: PULL_DAY },
      { dayOfWeek: 3, label: 'Legs', exercises: LEGS_DAY },
      { dayOfWeek: 4, label: 'Push', exercises: PUSH_DAY },
      { dayOfWeek: 5, label: 'Pull', exercises: PULL_DAY },
      { dayOfWeek: 6, label: 'Legs', exercises: LEGS_DAY },
    ],
  },
  {
    name: 'Brosplit',
    description: 'Classic body-part split — one muscle group per day for maximum isolation volume.',
    daysPerWeek: 5,
    difficulty: 'Intermediate',
    days: [
      { dayOfWeek: 1, label: 'Chest', exercises: [
        { name: 'Bench Press',          sets: 4, reps: '8'  },
        { name: 'Incline Bench Press',  sets: 4, reps: '8'  },
        { name: 'Decline Bench Press',  sets: 3, reps: '10' },
        { name: 'Low to High Cable Fly', sets: 3, reps: '12' },
        { name: 'Pec Deck Machine',     sets: 3, reps: '15' },
        { name: 'Cable Rope Tricep Extension', sets: 3, reps: '12' },
      ]},
      { dayOfWeek: 2, label: 'Back', exercises: [
        { name: 'Pull-Up',                   sets: 4, reps: '8'  },
        { name: 'Barbell Row',               sets: 4, reps: '8'  },
        { name: 'Lat Pulldown',              sets: 3, reps: '10' },
        { name: 'Seated Cable Row Neutral',  sets: 3, reps: '12' },
        { name: 'Cable Pullover',            sets: 3, reps: '12' },
      ]},
      { dayOfWeek: 3, label: 'Shoulders', exercises: [
        { name: 'Overhead Press (OHP)', sets: 4, reps: '8'  },
        { name: 'Arnold Press',         sets: 3, reps: '10' },
        { name: 'Cable Lateral Raise',  sets: 4, reps: '12' },
        { name: 'Front Raise',          sets: 3, reps: '12' },
        { name: 'Face Pull',            sets: 3, reps: '15' },
        { name: 'Barbell Shrug',        sets: 3, reps: '12' },
      ]},
      { dayOfWeek: 4, label: 'Legs', exercises: LEGS_DAY },
      { dayOfWeek: 5, label: 'Arms', exercises: [
        { name: 'Bayesian Cable Curl',            sets: 4, reps: '10' },
        { name: 'Incline Dumbbell Curl',          sets: 3, reps: '12' },
        { name: 'Preacher Curl',                  sets: 3, reps: '12' },
        { name: 'Close-Grip Bench Press',         sets: 4, reps: '10' },
        { name: 'Overhead Cable Tricep Extension', sets: 3, reps: '12' },
        { name: 'Cable Rope Tricep Extension',    sets: 3, reps: '15' },
      ]},
    ],
  },
  {
    name: 'Arnold Split',
    description: "Arnold Schwarzenegger's 6-day split pairing opposing muscle groups for maximum pump.",
    daysPerWeek: 6,
    difficulty: 'Advanced',
    days: [
      { dayOfWeek: 1, label: 'Chest + Back',       exercises: ARNOLD_CHEST_BACK      },
      { dayOfWeek: 2, label: 'Shoulders + Arms',   exercises: ARNOLD_SHOULDERS_ARMS  },
      { dayOfWeek: 3, label: 'Legs',               exercises: ARNOLD_LEGS            },
      { dayOfWeek: 4, label: 'Chest + Back',       exercises: ARNOLD_CHEST_BACK      },
      { dayOfWeek: 5, label: 'Shoulders + Arms',   exercises: ARNOLD_SHOULDERS_ARMS  },
      { dayOfWeek: 6, label: 'Legs',               exercises: ARNOLD_LEGS            },
    ],
  },
  {
    name: 'Antagonist Split',
    description: 'Pairs opposing muscle groups each session — antagonists stay fresh while agonists work.',
    daysPerWeek: 4,
    difficulty: 'Intermediate',
    days: [
      { dayOfWeek: 1, label: 'Chest + Biceps', exercises: [
        { name: 'Bench Press',           sets: 4, reps: '8'  },
        { name: 'Bayesian Cable Curl',   sets: 4, reps: '10' },
        { name: 'Incline Bench Press',   sets: 3, reps: '10' },
        { name: 'Preacher Curl',         sets: 3, reps: '12' },
        { name: 'Low to High Cable Fly', sets: 3, reps: '12' },
        { name: 'Incline Dumbbell Curl', sets: 3, reps: '12' },
      ]},
      { dayOfWeek: 2, label: 'Back + Triceps', exercises: [
        { name: 'Pull-Up',                          sets: 4, reps: '8'  },
        { name: 'Barbell Row',                      sets: 3, reps: '8'  },
        { name: 'Cable Pullover',                   sets: 3, reps: '12' },
        { name: 'Close-Grip Bench Press',           sets: 4, reps: '10' },
        { name: 'Overhead Cable Tricep Extension',  sets: 3, reps: '12' },
        { name: 'Cable Rope Tricep Extension',      sets: 3, reps: '15' },
      ]},
      { dayOfWeek: 4, label: 'Shoulders + Biceps', exercises: [
        { name: 'Overhead Press (OHP)',  sets: 4, reps: '8'  },
        { name: 'Bayesian Cable Curl',   sets: 3, reps: '10' },
        { name: 'Arnold Press',          sets: 3, reps: '10' },
        { name: 'Incline Dumbbell Curl', sets: 3, reps: '12' },
        { name: 'Cable Lateral Raise',   sets: 4, reps: '12' },
        { name: 'Preacher Curl',         sets: 3, reps: '12' },
      ]},
      { dayOfWeek: 5, label: 'Legs + Triceps', exercises: [
        { name: 'Squat',                            sets: 4, reps: '6'  },
        { name: 'Close-Grip Bench Press',           sets: 3, reps: '10' },
        { name: 'Romanian Deadlift (RDL)',          sets: 3, reps: '8'  },
        { name: 'Overhead Cable Tricep Extension',  sets: 3, reps: '12' },
        { name: 'Leg Press',                        sets: 3, reps: '10' },
        { name: 'Cable Rope Tricep Extension',      sets: 3, reps: '15' },
      ]},
    ],
  },
  {
    name: 'PHUL',
    description: 'Power Hypertrophy Upper Lower — strength work (3-5 reps) meets hypertrophy (8-15 reps) twice a week each.',
    daysPerWeek: 4,
    difficulty: 'Advanced',
    days: [
      { dayOfWeek: 1, label: 'Upper Power', exercises: [
        { name: 'Bench Press',                      sets: 3, reps: '5' },
        { name: 'Barbell Row',                      sets: 3, reps: '5' },
        { name: 'Overhead Press (OHP)',             sets: 3, reps: '5' },
        { name: 'Pull-Up',                          sets: 3, reps: '5' },
        { name: 'Bayesian Cable Curl',              sets: 2, reps: '8' },
        { name: 'Overhead Cable Tricep Extension',  sets: 2, reps: '8' },
      ]},
      { dayOfWeek: 2, label: 'Lower Power', exercises: [
        { name: 'Squat',               sets: 3, reps: '5' },
        { name: 'Deadlift',            sets: 3, reps: '5' },
        { name: 'Leg Press',           sets: 2, reps: '8' },
        { name: 'Seated Leg Curl',     sets: 2, reps: '8' },
        { name: 'Standing Calf Raise', sets: 3, reps: '8' },
      ]},
      { dayOfWeek: 4, label: 'Upper Hypertrophy', exercises: [
        { name: 'Incline Bench Press',        sets: 4, reps: '12' },
        { name: 'Seated Cable Row Neutral',   sets: 4, reps: '12' },
        { name: 'Dumbbell Shoulder Press',    sets: 3, reps: '12' },
        { name: 'Lat Pulldown',               sets: 3, reps: '12' },
        { name: 'Low to High Cable Fly',      sets: 3, reps: '15' },
        { name: 'Face Pull',                  sets: 3, reps: '15' },
        { name: 'Incline Dumbbell Curl',      sets: 3, reps: '12' },
        { name: 'Cable Rope Tricep Extension', sets: 3, reps: '12' },
      ]},
      { dayOfWeek: 5, label: 'Lower Hypertrophy', exercises: [
        { name: 'Front Squat',             sets: 4, reps: '12' },
        { name: 'Romanian Deadlift (RDL)', sets: 4, reps: '12' },
        { name: 'Leg Extension',           sets: 3, reps: '12' },
        { name: 'Seated Leg Curl',         sets: 3, reps: '12' },
        { name: 'Hip Thrust',              sets: 3, reps: '12' },
        { name: 'Standing Calf Raise',     sets: 4, reps: '15' },
      ]},
    ],
  },
  {
    name: 'PHAT',
    description: 'Power Hypertrophy Adaptive Training — 5-day program blending power and hypertrophy for advanced lifters.',
    daysPerWeek: 5,
    difficulty: 'Advanced',
    days: [
      { dayOfWeek: 1, label: 'Upper Power', exercises: [
        { name: 'Barbell Row',           sets: 3, reps: '5' },
        { name: 'Lat Pulldown',          sets: 2, reps: '8' },
        { name: 'Bench Press',           sets: 3, reps: '5' },
        { name: 'Incline Bench Press',   sets: 2, reps: '8' },
        { name: 'Bayesian Cable Curl',   sets: 3, reps: '5' },
        { name: 'Close-Grip Bench Press', sets: 3, reps: '5' },
      ]},
      { dayOfWeek: 2, label: 'Lower Power', exercises: [
        { name: 'Squat',               sets: 3, reps: '5' },
        { name: 'Deadlift',            sets: 3, reps: '5' },
        { name: 'Leg Press',           sets: 2, reps: '8' },
        { name: 'Seated Leg Curl',     sets: 2, reps: '8' },
        { name: 'Standing Calf Raise', sets: 2, reps: '8' },
      ]},
      { dayOfWeek: 4, label: 'Back + Shoulders Hypertrophy', exercises: [
        { name: 'Seated Cable Row Neutral', sets: 3, reps: '12' },
        { name: 'Single-Arm Dumbbell Row', sets: 3, reps: '12' },
        { name: 'Lat Pulldown',            sets: 3, reps: '12' },
        { name: 'Overhead Press (OHP)',    sets: 3, reps: '12' },
        { name: 'Arnold Press',            sets: 3, reps: '12' },
        { name: 'Cable Lateral Raise',     sets: 4, reps: '15' },
        { name: 'Face Pull',               sets: 3, reps: '15' },
      ]},
      { dayOfWeek: 5, label: 'Lower Hypertrophy', exercises: [
        { name: 'Hack Squat',              sets: 4, reps: '12' },
        { name: 'Romanian Deadlift (RDL)', sets: 3, reps: '12' },
        { name: 'Leg Press',               sets: 3, reps: '12' },
        { name: 'Leg Extension',           sets: 3, reps: '15' },
        { name: 'Seated Leg Curl',         sets: 3, reps: '15' },
        { name: 'Hip Thrust',              sets: 3, reps: '15' },
        { name: 'Standing Calf Raise',     sets: 4, reps: '15' },
      ]},
      { dayOfWeek: 6, label: 'Chest + Arms Hypertrophy', exercises: [
        { name: 'Bench Press',                      sets: 3, reps: '12' },
        { name: 'Incline Bench Press',              sets: 3, reps: '12' },
        { name: 'Low to High Cable Fly',            sets: 3, reps: '15' },
        { name: 'Bayesian Cable Curl',              sets: 3, reps: '12' },
        { name: 'Preacher Curl',                    sets: 3, reps: '12' },
        { name: 'Incline Dumbbell Curl',            sets: 3, reps: '12' },
        { name: 'Close-Grip Bench Press',           sets: 3, reps: '12' },
        { name: 'Overhead Cable Tricep Extension',  sets: 3, reps: '12' },
        { name: 'Cable Rope Tricep Extension',      sets: 3, reps: '15' },
      ]},
    ],
  },
  {
    name: 'Glute Focus',
    description: 'Hip-thrust-forward 4-day program designed to maximize glute and posterior chain development.',
    daysPerWeek: 4,
    difficulty: 'Intermediate',
    days: [
      { dayOfWeek: 1, label: 'Glutes + Posterior Chain', exercises: [
        { name: 'Hip Thrust',              sets: 4, reps: '12' },
        { name: 'Romanian Deadlift (RDL)', sets: 4, reps: '12' },
        { name: 'Seated Leg Curl',         sets: 3, reps: '12' },
        { name: 'Cable Kickback',          sets: 3, reps: '15' },
        { name: 'Machine Hip Abduction',   sets: 3, reps: '20' },
        { name: 'Glute Bridge',            sets: 3, reps: '12' },
      ]},
      { dayOfWeek: 2, label: 'Upper Push', exercises: [
        { name: 'Dumbbell Shoulder Press',          sets: 4, reps: '12' },
        { name: 'Incline Bench Press',              sets: 3, reps: '12' },
        { name: 'Cable Lateral Raise',              sets: 4, reps: '15' },
        { name: 'Overhead Cable Tricep Extension',  sets: 3, reps: '12' },
        { name: 'Cable Rope Tricep Extension',      sets: 3, reps: '15' },
        { name: 'Face Pull',                        sets: 3, reps: '15' },
      ]},
      { dayOfWeek: 4, label: 'Legs + Glutes', exercises: [
        { name: 'Squat',               sets: 4, reps: '12' },
        { name: 'Bulgarian Split Squat', sets: 3, reps: '12' },
        { name: 'Leg Press',           sets: 3, reps: '12' },
        { name: 'Hip Thrust',          sets: 3, reps: '12' },
        { name: 'Leg Extension',       sets: 3, reps: '15' },
        { name: 'Standing Calf Raise', sets: 4, reps: '15' },
      ]},
      { dayOfWeek: 5, label: 'Upper Pull', exercises: [
        { name: 'Lat Pulldown',              sets: 4, reps: '12' },
        { name: 'Single-Arm Dumbbell Row',   sets: 4, reps: '12' },
        { name: 'Pull-Up',                   sets: 3, reps: '10' },
        { name: 'Incline Dumbbell Curl',     sets: 3, reps: '12' },
        { name: 'Bayesian Cable Curl',       sets: 3, reps: '12' },
        { name: 'Seated Cable Row Neutral',  sets: 3, reps: '15' },
      ]},
    ],
  },
  {
    name: 'ULPPL',
    description: '5-day Upper/Lower/Push/Pull/Legs — strength days on Upper & Lower, hypertrophy days on PPL. Ideal for Intermediate–Advanced lifters.',
    daysPerWeek: 5,
    difficulty: 'Advanced',
    days: [
      { dayOfWeek: 1, label: 'Upper Strength', exercises: [
        { name: 'Bench Press',                      sets: 4, reps: '5' },
        { name: 'Barbell Row',                      sets: 4, reps: '5' },
        { name: 'Overhead Press (OHP)',             sets: 3, reps: '5' },
        { name: 'Weighted Pull-Up',                 sets: 3, reps: '5' },
        { name: 'Bayesian Cable Curl',              sets: 2, reps: '8' },
        { name: 'Overhead Cable Tricep Extension',  sets: 2, reps: '8' },
      ]},
      { dayOfWeek: 2, label: 'Lower Strength', exercises: [
        { name: 'Squat',                    sets: 4, reps: '5'  },
        { name: 'Deadlift',                sets: 3, reps: '5'  },
        { name: 'Romanian Deadlift (RDL)', sets: 3, reps: '8'  },
        { name: 'Leg Press',               sets: 2, reps: '10' },
        { name: 'Seated Leg Curl',         sets: 2, reps: '10' },
      ]},
      { dayOfWeek: 3, label: 'Push Hypertrophy', exercises: [
        { name: 'Incline Bench Press',              sets: 4, reps: '10' },
        { name: 'Overhead Press (OHP)',             sets: 3, reps: '12' },
        { name: 'Low to High Cable Fly',            sets: 3, reps: '12' },
        { name: 'Cable Lateral Raise',              sets: 4, reps: '15' },
        { name: 'Overhead Cable Tricep Extension',  sets: 3, reps: '12' },
        { name: 'Cable Rope Tricep Extension',      sets: 3, reps: '15' },
      ]},
      { dayOfWeek: 4, label: 'Pull Hypertrophy', exercises: [
        { name: 'Lat Pulldown',              sets: 4, reps: '12' },
        { name: 'Seated Cable Row Neutral',  sets: 3, reps: '12' },
        { name: 'Cable Pullover',            sets: 3, reps: '12' },
        { name: 'Face Pull',                 sets: 3, reps: '15' },
        { name: 'Bayesian Cable Curl',       sets: 3, reps: '12' },
        { name: 'Incline Dumbbell Curl',     sets: 3, reps: '12' },
      ]},
      { dayOfWeek: 5, label: 'Legs Hypertrophy', exercises: [
        { name: 'Hack Squat',              sets: 4, reps: '12' },
        { name: 'Romanian Deadlift (RDL)', sets: 3, reps: '12' },
        { name: 'Leg Press',               sets: 3, reps: '15' },
        { name: 'Leg Extension',           sets: 3, reps: '15' },
        { name: 'Seated Leg Curl',         sets: 3, reps: '12' },
        { name: 'Hip Thrust',              sets: 3, reps: '15' },
        { name: 'Calf Raise on Leg Press', sets: 4, reps: '15' },
      ]},
    ],
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Build exercise name → id map (non-custom only)
  const allExercises = await prisma.exercise.findMany({ where: { isCustom: false } });
  const exMap = new Map(allExercises.map((e) => [e.name, e.id]));

  // Wipe and recreate all templates (global, not user-owned — safe to delete)
  await prisma.routineTemplate.deleteMany({});

  for (const tpl of TEMPLATES) {
    await prisma.routineTemplate.create({
      data: {
        name: tpl.name,
        description: tpl.description,
        daysPerWeek: tpl.daysPerWeek,
        difficulty: tpl.difficulty,
        days: {
          create: tpl.days.map((day) => ({
            dayOfWeek: day.dayOfWeek,
            label: day.label,
            exercises: {
              create: day.exercises.map((ex, order) => {
                const exerciseId = exMap.get(ex.name);
                if (!exerciseId) throw new Error(`Exercise not found in DB: "${ex.name}". Run seed.ts first.`);
                return { exerciseId, sets: ex.sets, repsDisplay: ex.reps, order };
              }),
            },
          })),
        },
      },
    });
    console.log(`✓ ${tpl.name}`);
  }

  console.log(`\nSeeded ${TEMPLATES.length} templates.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
