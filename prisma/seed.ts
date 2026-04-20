import { PrismaClient, MuscleGroup, Equipment, TrophyCategory } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Exercise upsert helper ────────────────────────────────────────────────────
async function upsertExercise(data: {
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  stretchFocused?: boolean;
}) {
  const ex = await prisma.exercise.findFirst({ where: { name: data.name, isCustom: false } });
  if (ex) {
    await prisma.exercise.update({
      where: { id: ex.id },
      data: { muscleGroup: data.muscleGroup, equipment: data.equipment, stretchFocused: data.stretchFocused ?? false },
    });
  } else {
    await prisma.exercise.create({ data: { ...data, isCustom: false, stretchFocused: data.stretchFocused ?? false } });
  }
}

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Exercises (stored in English — translated at display time via i18n) ───
  const exercises: { name: string; muscleGroup: MuscleGroup; equipment: Equipment; stretchFocused?: boolean }[] = [
    // Chest
    { name: 'Bench Press',               muscleGroup: MuscleGroup.CHEST,     equipment: Equipment.BARBELL    },
    { name: 'Incline Bench Press',        muscleGroup: MuscleGroup.CHEST,     equipment: Equipment.BARBELL,   stretchFocused: true },
    { name: 'Incline Dumbbell Press',     muscleGroup: MuscleGroup.CHEST,     equipment: Equipment.DUMBBELL,  stretchFocused: true },
    { name: 'Decline Bench Press',        muscleGroup: MuscleGroup.CHEST,     equipment: Equipment.BARBELL    },
    { name: 'Cable Crossover',            muscleGroup: MuscleGroup.CHEST,     equipment: Equipment.CABLE      },
    { name: 'Low to High Cable Fly',      muscleGroup: MuscleGroup.CHEST,     equipment: Equipment.CABLE,     stretchFocused: true },
    { name: 'Pec Deck Machine',           muscleGroup: MuscleGroup.CHEST,     equipment: Equipment.MACHINE    },
    { name: 'Push-Up',                    muscleGroup: MuscleGroup.CHEST,     equipment: Equipment.BODYWEIGHT },
    { name: 'Chest Press Machine',        muscleGroup: MuscleGroup.CHEST,     equipment: Equipment.MACHINE    },
    // Back
    { name: 'Deadlift',                   muscleGroup: MuscleGroup.BACK,      equipment: Equipment.BARBELL    },
    { name: 'Barbell Row',                muscleGroup: MuscleGroup.BACK,      equipment: Equipment.BARBELL    },
    { name: 'Pull-Up',                    muscleGroup: MuscleGroup.BACK,      equipment: Equipment.BODYWEIGHT },
    { name: 'Weighted Pull-Up',           muscleGroup: MuscleGroup.BACK,      equipment: Equipment.BODYWEIGHT },
    { name: 'Chin-Up',                    muscleGroup: MuscleGroup.BACK,      equipment: Equipment.BODYWEIGHT },
    { name: 'Lat Pulldown',               muscleGroup: MuscleGroup.BACK,      equipment: Equipment.CABLE      },
    { name: 'Seated Cable Row',           muscleGroup: MuscleGroup.BACK,      equipment: Equipment.CABLE      },
    { name: 'Seated Cable Row Neutral',   muscleGroup: MuscleGroup.BACK,      equipment: Equipment.CABLE      },
    { name: 'T-Bar Row',                  muscleGroup: MuscleGroup.BACK,      equipment: Equipment.BARBELL    },
    { name: 'Single-Arm Dumbbell Row',    muscleGroup: MuscleGroup.BACK,      equipment: Equipment.DUMBBELL   },
    { name: 'Cable Pullover',             muscleGroup: MuscleGroup.BACK,      equipment: Equipment.CABLE,     stretchFocused: true },
    // Shoulders
    { name: 'Overhead Press (OHP)',       muscleGroup: MuscleGroup.SHOULDERS, equipment: Equipment.BARBELL    },
    { name: 'Dumbbell Shoulder Press',    muscleGroup: MuscleGroup.SHOULDERS, equipment: Equipment.DUMBBELL   },
    { name: 'Lateral Raise',              muscleGroup: MuscleGroup.SHOULDERS, equipment: Equipment.DUMBBELL   },
    { name: 'Cable Lateral Raise',        muscleGroup: MuscleGroup.SHOULDERS, equipment: Equipment.CABLE      },
    { name: 'Front Raise',                muscleGroup: MuscleGroup.SHOULDERS, equipment: Equipment.DUMBBELL   },
    { name: 'Rear Delt Fly',              muscleGroup: MuscleGroup.SHOULDERS, equipment: Equipment.DUMBBELL   },
    { name: 'Arnold Press',               muscleGroup: MuscleGroup.SHOULDERS, equipment: Equipment.DUMBBELL   },
    { name: 'Face Pull',                  muscleGroup: MuscleGroup.SHOULDERS, equipment: Equipment.CABLE      },
    { name: 'Barbell Shrug',              muscleGroup: MuscleGroup.SHOULDERS, equipment: Equipment.BARBELL    },
    // Neck
    { name: 'Neck Flexion',              muscleGroup: MuscleGroup.NECK,      equipment: Equipment.OTHER      },
    { name: 'Neck Extension',            muscleGroup: MuscleGroup.NECK,      equipment: Equipment.OTHER      },
    { name: 'Lateral Neck Flexion',      muscleGroup: MuscleGroup.NECK,      equipment: Equipment.OTHER      },
    { name: 'Neck Harness',              muscleGroup: MuscleGroup.NECK,      equipment: Equipment.OTHER      },
    // Biceps
    { name: 'Barbell Curl',              muscleGroup: MuscleGroup.BICEPS,    equipment: Equipment.BARBELL    },
    { name: 'Dumbbell Curl',             muscleGroup: MuscleGroup.BICEPS,    equipment: Equipment.DUMBBELL   },
    { name: 'Hammer Curl',               muscleGroup: MuscleGroup.BICEPS,    equipment: Equipment.DUMBBELL   },
    { name: 'Preacher Curl',             muscleGroup: MuscleGroup.BICEPS,    equipment: Equipment.BARBELL,   stretchFocused: true },
    { name: 'Cable Curl',                muscleGroup: MuscleGroup.BICEPS,    equipment: Equipment.CABLE      },
    { name: 'Bayesian Cable Curl',       muscleGroup: MuscleGroup.BICEPS,    equipment: Equipment.CABLE,     stretchFocused: true },
    { name: 'Incline Dumbbell Curl',     muscleGroup: MuscleGroup.BICEPS,    equipment: Equipment.DUMBBELL,  stretchFocused: true },
    { name: 'Low Pulley Cable Curl',     muscleGroup: MuscleGroup.BICEPS,    equipment: Equipment.CABLE      },
    // Triceps
    { name: 'Tricep Pushdown',                muscleGroup: MuscleGroup.TRICEPS,   equipment: Equipment.CABLE      },
    { name: 'Cable Rope Tricep Extension',    muscleGroup: MuscleGroup.TRICEPS,   equipment: Equipment.CABLE      },
    { name: 'Skull Crusher',                  muscleGroup: MuscleGroup.TRICEPS,   equipment: Equipment.BARBELL    },
    { name: 'Close-Grip Bench Press',         muscleGroup: MuscleGroup.TRICEPS,   equipment: Equipment.BARBELL    },
    { name: 'Overhead Tricep Extension',      muscleGroup: MuscleGroup.TRICEPS,   equipment: Equipment.DUMBBELL   },
    { name: 'Overhead Cable Tricep Extension',muscleGroup: MuscleGroup.TRICEPS,   equipment: Equipment.CABLE,     stretchFocused: true },
    { name: 'Tricep Dips',                    muscleGroup: MuscleGroup.TRICEPS,   equipment: Equipment.BODYWEIGHT },
    // Core
    { name: 'Plank',              muscleGroup: MuscleGroup.CORE,       equipment: Equipment.BODYWEIGHT },
    { name: 'Cable Crunch',       muscleGroup: MuscleGroup.CORE,       equipment: Equipment.CABLE      },
    { name: 'Machine Crunch',     muscleGroup: MuscleGroup.CORE,       equipment: Equipment.MACHINE    },
    { name: 'Hanging Leg Raise',  muscleGroup: MuscleGroup.CORE,       equipment: Equipment.BODYWEIGHT },
    { name: 'Russian Twist',      muscleGroup: MuscleGroup.CORE,       equipment: Equipment.BODYWEIGHT },
    // Quads
    { name: 'Squat',                  muscleGroup: MuscleGroup.QUADS,      equipment: Equipment.BARBELL    },
    { name: 'Front Squat',            muscleGroup: MuscleGroup.QUADS,      equipment: Equipment.BARBELL    },
    { name: 'Leg Press',              muscleGroup: MuscleGroup.QUADS,      equipment: Equipment.MACHINE    },
    { name: 'Hack Squat',             muscleGroup: MuscleGroup.QUADS,      equipment: Equipment.MACHINE    },
    { name: 'Leg Extension',          muscleGroup: MuscleGroup.QUADS,      equipment: Equipment.MACHINE    },
    { name: 'Bulgarian Split Squat',  muscleGroup: MuscleGroup.QUADS,      equipment: Equipment.DUMBBELL   },
    { name: 'Walking Lunges',         muscleGroup: MuscleGroup.QUADS,      equipment: Equipment.DUMBBELL   },
    // Hamstrings
    { name: 'Romanian Deadlift (RDL)', muscleGroup: MuscleGroup.HAMSTRINGS, equipment: Equipment.BARBELL,   stretchFocused: true },
    { name: 'Leg Curl',                muscleGroup: MuscleGroup.HAMSTRINGS, equipment: Equipment.MACHINE    },
    { name: 'Seated Leg Curl',         muscleGroup: MuscleGroup.HAMSTRINGS, equipment: Equipment.MACHINE,   stretchFocused: true },
    { name: 'Stiff-Leg Deadlift',      muscleGroup: MuscleGroup.HAMSTRINGS, equipment: Equipment.BARBELL    },
    // Glutes
    { name: 'Hip Thrust',           muscleGroup: MuscleGroup.GLUTES,     equipment: Equipment.BARBELL    },
    { name: 'Machine Hip Thrust',   muscleGroup: MuscleGroup.GLUTES,     equipment: Equipment.MACHINE    },
    { name: 'Glute Bridge',         muscleGroup: MuscleGroup.GLUTES,     equipment: Equipment.BODYWEIGHT },
    { name: 'Cable Kickback',       muscleGroup: MuscleGroup.GLUTES,     equipment: Equipment.CABLE      },
    { name: 'Machine Hip Abduction',muscleGroup: MuscleGroup.GLUTES,     equipment: Equipment.MACHINE    },
    // Calves — Seated/Donkey removed (replaced by Standing + Leg Press variants)
    { name: 'Standing Calf Raise',     muscleGroup: MuscleGroup.CALVES,    equipment: Equipment.MACHINE    },
    { name: 'Calf Raise on Leg Press', muscleGroup: MuscleGroup.CALVES,    equipment: Equipment.MACHINE    },
    // Full body / Cardio
    { name: 'Clean and Press',   muscleGroup: MuscleGroup.FULL_BODY, equipment: Equipment.BARBELL    },
    { name: 'Kettlebell Swing',  muscleGroup: MuscleGroup.FULL_BODY, equipment: Equipment.KETTLEBELL },
    { name: 'Burpee',            muscleGroup: MuscleGroup.FULL_BODY, equipment: Equipment.BODYWEIGHT },
    { name: 'Treadmill',         muscleGroup: MuscleGroup.CARDIO,    equipment: Equipment.MACHINE    },
    { name: 'Rowing Machine',    muscleGroup: MuscleGroup.CARDIO,    equipment: Equipment.MACHINE    },
    { name: 'Jump Rope',         muscleGroup: MuscleGroup.CARDIO,    equipment: Equipment.OTHER      },
  ];

  for (const ex of exercises) {
    await upsertExercise(ex);
  }
  console.log(`  ✓ ${exercises.length} exercises upserted`);

  // Try to remove deprecated exercises (only if they have no workout history)
  const DEPRECATED = ['Crunch', 'Seated Calf Raise', 'Donkey Calf Raise', 'Dumbbell Pullover'];
  for (const name of DEPRECATED) {
    try {
      const ex = await prisma.exercise.findFirst({ where: { name, isCustom: false } });
      if (!ex) continue;
      const hasHistory = await prisma.workoutSet.findFirst({ where: { exerciseId: ex.id } });
      if (!hasHistory) {
        await prisma.routineExercise.deleteMany({ where: { exerciseId: ex.id } });
        await prisma.templateExercise.deleteMany({ where: { exerciseId: ex.id } });
        await prisma.exercise.delete({ where: { id: ex.id } });
        console.log(`  ✓ Removed deprecated exercise: ${name}`);
      } else {
        console.log(`  ⚠ Kept deprecated exercise (has workout history): ${name}`);
      }
    } catch (e) {
      console.log(`  ⚠ Could not remove ${name}: ${e}`);
    }
  }

  // ─── Foods ─────────────────────────────────────────────────────────────────
  // All values are per 100g RAW weight — single source of truth.

  // Migrate old food names → new canonical names before upserting.
  const FOOD_RENAMES: [string, string][] = [
    ['Chicken Breast (cooked)', 'Pechuga de Pollo'],
    ['Salmon (cooked)',          'Salmón'],
    ['Tilapia (cooked)',         'Tilapia'],
    ['Shrimp (cooked)',          'Camarón'],
    ['White Rice (cooked)',      'Arroz Blanco'],
    ['Brown Rice (cooked)',      'Arroz Integral'],
    ['Oats (dry)',               'Avena'],
    ['Sweet Potato (cooked)',    'Batata'],
    ['Potato (baked)',           'Papa'],
    ['Pasta (cooked)',           'Pasta'],
    ['Quinoa (cooked)',          'Quinoa'],
    ['Asado de tira',            'Asado de Tira'],
    ['Costilla de res',          'Costilla'],
    ['Colita de cuadril',        'Colita de Cuadril'],
  ];
  let renamedCount = 0;
  for (const [oldName, newName] of FOOD_RENAMES) {
    const old = await prisma.food.findFirst({ where: { name: oldName, isCustom: false } });
    if (!old) continue;
    const target = await prisma.food.findFirst({ where: { name: newName, isCustom: false } });
    if (target) {
      await prisma.mealLogItem.updateMany({ where: { foodId: old.id }, data: { foodId: target.id } });
      await prisma.food.delete({ where: { id: old.id } });
    } else {
      await prisma.food.update({ where: { id: old.id }, data: { name: newName } });
    }
    renamedCount++;
  }
  if (renamedCount > 0) console.log(`  ✓ Renamed ${renamedCount} legacy food entries`);

  const foods = [
    // Carnes blancas — raw values (chicken ÷ 0.75)
    { name: 'Pechuga de Pollo',   calories: 220,  protein: 41.3, carbs: 0,    fat: 4.8,  fiber: 0,    serving: 100 },
    { name: 'Ground Beef (lean)', calories: 215,  protein: 26,   carbs: 0,    fat: 12,   fiber: 0,    serving: 100 },
    // Pescados — raw values (fish ÷ 0.80)
    { name: 'Salmón',             calories: 260,  protein: 25,   carbs: 0,    fat: 16.3, fiber: 0,    serving: 100 },
    { name: 'Tuna (canned in water)', calories: 116, protein: 25, carbs: 0,   fat: 1,    fiber: 0,    serving: 100 },
    { name: 'Tilapia',            calories: 160,  protein: 32.5, carbs: 0,    fat: 3.4,  fiber: 0,    serving: 100 },
    { name: 'Camarón',            calories: 124,  protein: 26.3, carbs: 1.1,  fat: 1.8,  fiber: 0,    serving: 100 },
    // Huevos y lácteos
    { name: 'Egg (whole)',        calories: 155,  protein: 13,   carbs: 1.1,  fat: 11,   fiber: 0,    serving: 100 },
    { name: 'Egg White',          calories: 52,   protein: 11,   carbs: 0.7,  fat: 0.2,  fiber: 0,    serving: 100 },
    { name: 'Greek Yogurt (plain 0%)', calories: 59, protein: 10, carbs: 3.6, fat: 0.4,  fiber: 0,    serving: 100 },
    { name: 'Cottage Cheese',     calories: 98,   protein: 11,   carbs: 3.4,  fat: 4.3,  fiber: 0,    serving: 100 },
    { name: 'Whey Protein Powder',calories: 370,  protein: 80,   carbs: 6,    fat: 4,    fiber: 0,    serving: 100 },
    // Carbohidratos — raw values (grain ÷ 0.33, vegetable ÷ 0.90)
    { name: 'Arroz Blanco',       calories: 394,  protein: 8.2,  carbs: 84.8, fat: 0.9,  fiber: 1.2,  serving: 100 },
    { name: 'Arroz Integral',     calories: 336,  protein: 7.9,  carbs: 69.7, fat: 2.7,  fiber: 5.5,  serving: 100 },
    { name: 'Avena',              calories: 389,  protein: 17,   carbs: 66,   fat: 7,    fiber: 10.6, serving: 100 },
    { name: 'Batata',             calories: 96,   protein: 1.8,  carbs: 22.2, fat: 0.1,  fiber: 3.3,  serving: 100 },
    { name: 'Papa',               calories: 103,  protein: 2.8,  carbs: 23.3, fat: 0.1,  fiber: 2.4,  serving: 100 },
    { name: 'Pasta',              calories: 397,  protein: 15.2, carbs: 75.8, fat: 3.3,  fiber: 5.5,  serving: 100 },
    { name: 'Quinoa',             calories: 364,  protein: 13.3, carbs: 66.7, fat: 5.8,  fiber: 8.5,  serving: 100 },
    { name: 'Whole Wheat Bread',  calories: 247,  protein: 13,   carbs: 41,   fat: 4.2,  fiber: 6.8,  serving: 100 },
    { name: 'White Bread',        calories: 265,  protein: 9,    carbs: 49,   fat: 3.2,  fiber: 2.7,  serving: 100 },
    // Verduras
    { name: 'Broccoli',           calories: 34,   protein: 2.8,  carbs: 7,    fat: 0.4,  fiber: 2.6,  serving: 100 },
    { name: 'Spinach',            calories: 23,   protein: 2.9,  carbs: 3.6,  fat: 0.4,  fiber: 2.2,  serving: 100 },
    { name: 'Mixed Salad Greens', calories: 20,   protein: 1.8,  carbs: 3.5,  fat: 0.3,  fiber: 2,    serving: 100 },
    // Frutas
    { name: 'Banana',             calories: 89,   protein: 1.1,  carbs: 23,   fat: 0.3,  fiber: 2.6,  serving: 100 },
    { name: 'Apple',              calories: 52,   protein: 0.3,  carbs: 14,   fat: 0.2,  fiber: 2.4,  serving: 100 },
    { name: 'Blueberries',        calories: 57,   protein: 0.7,  carbs: 14,   fat: 0.3,  fiber: 2.4,  serving: 100 },
    // Grasas
    { name: 'Avocado',            calories: 160,  protein: 2,    carbs: 9,    fat: 15,   fiber: 7,    serving: 100 },
    { name: 'Almonds',            calories: 579,  protein: 21,   carbs: 22,   fat: 50,   fiber: 12.5, serving: 100 },
    { name: 'Peanut Butter',      calories: 588,  protein: 25,   carbs: 20,   fat: 50,   fiber: 6,    serving: 100 },
    { name: 'Olive Oil',          calories: 884,  protein: 0,    carbs: 0,    fat: 100,  fiber: 0,    serving: 100 },
    // Lácteos
    { name: 'Whole Milk',         calories: 61,   protein: 3.2,  carbs: 4.8,  fat: 3.3,  fiber: 0,    serving: 100 },
    { name: 'Cheddar Cheese',     calories: 402,  protein: 25,   carbs: 1.3,  fat: 33,   fiber: 0,    serving: 100 },
    // Carnes rojas argentinas — raw values
    { name: 'Vacío',              calories: 161,  protein: 21.4, carbs: 0,    fat: 8.1,  fiber: 0,    serving: 100 },
    { name: 'Picanha',            calories: 220,  protein: 18.5, carbs: 0,    fat: 16,   fiber: 0,    serving: 100 },
    { name: 'Asado de Tira',      calories: 290,  protein: 17,   carbs: 0,    fat: 25,   fiber: 0,    serving: 100 },
    { name: 'Costilla',           calories: 270,  protein: 18,   carbs: 0,    fat: 22,   fiber: 0,    serving: 100 },
    { name: 'Entraña',            calories: 175,  protein: 20,   carbs: 0,    fat: 10.5, fiber: 0,    serving: 100 },
    { name: 'Colita de Cuadril',  calories: 168,  protein: 21,   carbs: 0,    fat: 9.3,  fiber: 0,    serving: 100 },
    { name: 'Matambre',           calories: 158,  protein: 20.5, carbs: 0,    fat: 8.5,  fiber: 0,    serving: 100 },
    // Cerdo — raw values
    { name: 'Bondiola de cerdo',  calories: 215,  protein: 18,   carbs: 0,    fat: 15.8, fiber: 0,    serving: 100 },
    { name: 'Paleta de cerdo',    calories: 185,  protein: 19.5, carbs: 0,    fat: 12,   fiber: 0,    serving: 100 },
    { name: 'Lomo de cerdo',      calories: 143,  protein: 21,   carbs: 0,    fat: 6.5,  fiber: 0,    serving: 100 },
    // Fiambres y embutidos
    { name: 'Chorizo crudo',      calories: 295,  protein: 14,   carbs: 1,    fat: 26,   fiber: 0,    serving: 100 },
    { name: 'Panceta',            calories: 403,  protein: 13,   carbs: 0,    fat: 39,   fiber: 0,    serving: 100 },
    { name: 'Morcilla',           calories: 315,  protein: 12,   carbs: 3,    fat: 28,   fiber: 0,    serving: 100 },
    { name: 'Salame',             calories: 358,  protein: 22,   carbs: 2,    fat: 29,   fiber: 0,    serving: 100 },
    { name: 'Pepperoni',          calories: 494,  protein: 20,   carbs: 2,    fat: 45,   fiber: 0,    serving: 100 },
    { name: 'Chorizo colorado',   calories: 380,  protein: 20,   carbs: 3,    fat: 32,   fiber: 0,    serving: 100 },
    { name: 'Mortadela',          calories: 280,  protein: 14,   carbs: 3,    fat: 23.5, fiber: 0,    serving: 100 },
    // Quesos
    { name: 'Queso cremoso',      calories: 290,  protein: 16,   carbs: 2,    fat: 24,   fiber: 0,    serving: 100 },
    { name: 'Queso pategrás',     calories: 370,  protein: 26,   carbs: 0,    fat: 29,   fiber: 0,    serving: 100 },
    { name: 'Queso mozzarella',   calories: 280,  protein: 22,   carbs: 2,    fat: 20.5, fiber: 0,    serving: 100 },
    { name: 'Queso provolone',    calories: 352,  protein: 26,   carbs: 2,    fat: 27,   fiber: 0,    serving: 100 },
    { name: 'Queso parmesano',    calories: 431,  protein: 38,   carbs: 4,    fat: 29,   fiber: 0,    serving: 100 },
    // Snacks y dulces
    { name: 'Chocolate negro 70%', calories: 598, protein: 8,   carbs: 46,   fat: 43,   fiber: 10,   serving: 100 },
    { name: 'Chocolate con leche', calories: 535, protein: 7,   carbs: 57,   fat: 31,   fiber: 2,    serving: 100 },
    { name: 'Dulce de leche',      calories: 321, protein: 7,   carbs: 55,   fat: 8,    fiber: 0,    serving: 100 },
    { name: 'Alfajor de maicena',  calories: 390, protein: 5,   carbs: 64,   fat: 13,   fiber: 1,    serving: 100 },
    { name: 'Galletitas de arroz', calories: 387, protein: 8,   carbs: 82,   fat: 3,    fiber: 1,    serving: 100 },
    { name: 'Maní con chocolate',  calories: 478, protein: 11,  carbs: 50,   fat: 26,   fiber: 3,    serving: 100 },
    { name: 'Granola',             calories: 476, protein: 10,  carbs: 64,   fat: 20,   fiber: 5,    serving: 100 },
    { name: 'Turrón',              calories: 394, protein: 8,   carbs: 68,   fat: 10,   fiber: 2,    serving: 100 },
    // Bebidas
    { name: 'Cerveza rubia lager',     calories: 43,  protein: 0.5, carbs: 3.5,  fat: 0,   fiber: 0,   serving: 100 },
    { name: 'Cerveza negra stout',     calories: 53,  protein: 0.5, carbs: 5,    fat: 0,   fiber: 0,   serving: 100 },
    { name: 'Vino tinto',              calories: 85,  protein: 0.1, carbs: 2.6,  fat: 0,   fiber: 0,   serving: 100 },
    { name: 'Vino blanco',             calories: 82,  protein: 0.1, carbs: 2.7,  fat: 0,   fiber: 0,   serving: 100 },
    { name: 'Fernet',                  calories: 220, protein: 0,   carbs: 16,   fat: 0,   fiber: 0,   serving: 100 },
    { name: 'Coca Cola',               calories: 42,  protein: 0,   carbs: 10.6, fat: 0,   fiber: 0,   serving: 100 },
    { name: 'Coca Cola Zero',          calories: 0.4, protein: 0,   carbs: 0.1,  fat: 0,   fiber: 0,   serving: 100 },
    { name: 'Jugo de naranja natural', calories: 45,  protein: 0.7, carbs: 10.4, fat: 0.2, fiber: 0.2, serving: 100 },
    { name: 'Gatorade',                calories: 26,  protein: 0,   carbs: 6.5,  fat: 0,   fiber: 0,   serving: 100 },
    { name: 'Monster Energy',          calories: 46,  protein: 0.5, carbs: 11,   fat: 0,   fiber: 0,   serving: 100 },
    // Condimentos
    { name: 'Mayonesa',          calories: 680,  protein: 1,   carbs: 1,  fat: 74.5, fiber: 0,   serving: 100 },
    { name: 'Ketchup',           calories: 102,  protein: 1.5, carbs: 24, fat: 0.1,  fiber: 0.5, serving: 100 },
    { name: 'Mostaza',           calories: 63,   protein: 4,   carbs: 5,  fat: 3,    fiber: 2,   serving: 100 },
    { name: 'Salsa de soja',     calories: 52,   protein: 8,   carbs: 5,  fat: 0,    fiber: 0,   serving: 100 },
    { name: 'Salsa de tomate',   calories: 29,   protein: 1.5, carbs: 5,  fat: 0.3,  fiber: 1,   serving: 100 },
    { name: 'Chimichurri',       calories: 352,  protein: 2,   carbs: 5,  fat: 36,   fiber: 1,   serving: 100 },
    { name: 'Aceite de girasol', calories: 884,  protein: 0,   carbs: 0,  fat: 100,  fiber: 0,   serving: 100 },
  ];

  // Remove duplicate non-custom foods
  const existingFoods = await prisma.food.findMany({ where: { isCustom: false }, orderBy: { id: 'asc' } });
  const seenNames = new Set<string>();
  const duplicateIds: string[] = [];
  for (const f of existingFoods) {
    if (seenNames.has(f.name)) duplicateIds.push(f.id);
    else seenNames.add(f.name);
  }
  if (duplicateIds.length > 0) {
    await prisma.mealLogItem.deleteMany({ where: { foodId: { in: duplicateIds } } });
    await prisma.food.deleteMany({ where: { id: { in: duplicateIds } } });
    console.log(`  ✓ Removed ${duplicateIds.length} duplicate food entries`);
  }

  // Upsert all foods; explicitly clear raw-macro fields on every pass.
  let upserted = 0;
  for (const food of foods) {
    const record = { ...food, rawCalories: null, rawProtein: null, rawCarbs: null, rawFat: null, defaultCookState: 'NA' };
    const existing = await prisma.food.findFirst({ where: { name: food.name, isCustom: false } });
    if (existing) {
      await prisma.food.update({ where: { id: existing.id }, data: record });
    } else {
      await prisma.food.create({ data: record });
    }
    upserted++;
  }
  console.log(`  ✓ ${upserted} foods upserted`);

  // ─── Trophies ──────────────────────────────────────────────────────────────
  const trophies = [
    { key: 'first_workout',        name: 'First Rep',        description: 'Log your first workout',             icon: '💪', category: TrophyCategory.CONSISTENCY, xpReward: 50   },
    { key: 'streak_7',             name: 'Week Warrior',     description: 'Maintain a 7-day active streak',     icon: '🔥', category: TrophyCategory.CONSISTENCY, xpReward: 100  },
    { key: 'streak_30',            name: 'Iron Will',        description: 'Maintain a 30-day active streak',    icon: '⚡', category: TrophyCategory.CONSISTENCY, xpReward: 500  },
    { key: 'streak_100',           name: 'Century Club',     description: 'Maintain a 100-day active streak',   icon: '💯', category: TrophyCategory.CONSISTENCY, xpReward: 2000 },
    { key: 'workouts_10',          name: 'Getting Started',  description: 'Complete 10 workouts',               icon: '🏋️', category: TrophyCategory.CONSISTENCY, xpReward: 100  },
    { key: 'workouts_50',          name: 'Dedicated',        description: 'Complete 50 workouts',               icon: '🎯', category: TrophyCategory.CONSISTENCY, xpReward: 300  },
    { key: 'workouts_100',         name: 'Century Lifter',   description: 'Complete 100 workouts',              icon: '🏆', category: TrophyCategory.CONSISTENCY, xpReward: 1000 },
    { key: 'first_pr',             name: 'Personal Record',  description: 'Break your first PR',                icon: '📈', category: TrophyCategory.STRENGTH,    xpReward: 75   },
    { key: 'pr_10',                name: 'Record Breaker',   description: 'Break 10 personal records',          icon: '🥇', category: TrophyCategory.STRENGTH,    xpReward: 250  },
    { key: 'bench_100kg',          name: 'Bench Century',    description: 'Bench press 100kg',                  icon: '🎖️', category: TrophyCategory.STRENGTH,    xpReward: 300  },
    { key: 'squat_100kg',          name: 'Squat Century',    description: 'Squat 100kg',                        icon: '🦵', category: TrophyCategory.STRENGTH,    xpReward: 300  },
    { key: 'deadlift_100kg',       name: 'Dead Century',     description: 'Deadlift 100kg',                     icon: '⚓', category: TrophyCategory.STRENGTH,    xpReward: 300  },
    { key: 'deadlift_2x_bodyweight',name: '2x Body',         description: 'Deadlift 2x your bodyweight',        icon: '🦾', category: TrophyCategory.STRENGTH,    xpReward: 500  },
    { key: 'first_meal_log',       name: 'Food Tracker',     description: 'Log your first meal',                icon: '🥗', category: TrophyCategory.NUTRITION,   xpReward: 25   },
    { key: 'meal_streak_7',        name: 'Meal Prep King',   description: 'Log meals for 7 days straight',      icon: '👨‍🍳', category: TrophyCategory.NUTRITION,   xpReward: 150  },
    { key: 'protein_goal_7',       name: 'Protein Machine',  description: 'Hit protein goal 7 days in a row',   icon: '🥩', category: TrophyCategory.NUTRITION,   xpReward: 200  },
    { key: 'calorie_goal_30',      name: 'Calorie Counter',  description: 'Hit calorie goal 30 days',           icon: '🔢', category: TrophyCategory.NUTRITION,   xpReward: 500  },
    { key: 'first_feels',          name: 'Self Aware',       description: 'Log your first daily check-in',      icon: '🧘', category: TrophyCategory.WELLNESS,    xpReward: 25   },
    { key: 'feels_streak_7',       name: 'Mind & Body',      description: 'Log check-ins for 7 days straight',  icon: '🌟', category: TrophyCategory.WELLNESS,    xpReward: 150  },
    { key: 'feels_streak_30',      name: 'Zen Master',       description: 'Log check-ins for 30 days straight', icon: '☯️', category: TrophyCategory.WELLNESS,    xpReward: 400  },
    { key: 'perfect_mood_7',       name: 'Good Vibes',       description: 'Rate mood 5/5 for 7 days',           icon: '😄', category: TrophyCategory.WELLNESS,    xpReward: 200  },
    { key: 'first_weigh_in',       name: 'On The Scale',     description: 'Log your first weight',              icon: '⚖️', category: TrophyCategory.MILESTONES,  xpReward: 25   },
    { key: 'weight_5kg_lost',      name: 'Lighter',          description: 'Lose 5kg from your starting weight', icon: '📉', category: TrophyCategory.MILESTONES,  xpReward: 300  },
    { key: 'weight_10kg_lost',     name: 'Transformation',   description: 'Lose 10kg from starting weight',     icon: '🦋', category: TrophyCategory.MILESTONES,  xpReward: 750  },
    { key: 'level_5',              name: 'Rising',           description: 'Reach Level 5',                      icon: '⬆️', category: TrophyCategory.MILESTONES,  xpReward: 0    },
    { key: 'level_10',             name: 'Veteran',          description: 'Reach Level 10',                     icon: '🎖️', category: TrophyCategory.MILESTONES,  xpReward: 0    },
    { key: 'level_25',             name: 'Elite',            description: 'Reach Level 25',                     icon: '👑', category: TrophyCategory.MILESTONES,  xpReward: 0    },
    { key: 'measurements_log',     name: 'Body Scanner',     description: 'Log your first body measurements',   icon: '📏', category: TrophyCategory.MILESTONES,  xpReward: 50   },
    { key: 'routine_created',      name: 'Planner',          description: 'Create your first routine',          icon: '📋', category: TrophyCategory.MILESTONES,  xpReward: 50   },
    { key: 'uri',         name: 'Uri',        description: 'Logged 5,000+ kcal two days in a row.',         icon: '✡️',             category: TrophyCategory.MISC, xpReward: 300,  unobtainable: false },
    { key: 'daniel',      name: 'Daniel',     description: 'Spent 2+ hours in a single workout session.',   icon: 'lucide:Stethoscope', category: TrophyCategory.MISC, xpReward: 200,  unobtainable: false },
    { key: 'justiciero',  name: 'Justiciero', description: 'Respect women.',                                icon: '🏳️‍🌈',            category: TrophyCategory.MISC, xpReward: 0,    unobtainable: true  },
  ];

  await prisma.trophy.createMany({ data: trophies, skipDuplicates: true });
  console.log(`  ✓ ${trophies.length} trophies seeded`);

  console.log('✅ Seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
