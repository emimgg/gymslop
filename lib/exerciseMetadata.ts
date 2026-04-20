export type MovementType = 'Compound' | 'Isolation';

export interface ExerciseMeta {
  movementType: MovementType;
  description: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
}

export const EXERCISE_META: Record<string, ExerciseMeta> = {
  // ── Chest ─────────────────────────────────────────────────────────────────
  'Bench Press': {
    movementType: 'Compound',
    description: 'The king of chest exercises. Lie flat on a bench and press the barbell from chest to lockout.',
    primaryMuscles: ['Pectoralis Major'],
    secondaryMuscles: ['Anterior Deltoid', 'Triceps'],
  },
  'Incline Bench Press': {
    movementType: 'Compound',
    description: 'Performed on a 30–45° incline to emphasize the upper chest and clavicular head.',
    primaryMuscles: ['Upper Pectoralis Major'],
    secondaryMuscles: ['Anterior Deltoid', 'Triceps'],
  },
  'Decline Bench Press': {
    movementType: 'Compound',
    description: 'Performed on a decline bench to target the lower chest with a greater range of motion.',
    primaryMuscles: ['Lower Pectoralis Major'],
    secondaryMuscles: ['Triceps', 'Anterior Deltoid'],
  },
  'Dumbbell Fly': {
    movementType: 'Isolation',
    description: 'Wide arc movement that isolates the chest with a deep stretch. Ideal for pectoral hypertrophy.',
    primaryMuscles: ['Pectoralis Major'],
    secondaryMuscles: ['Anterior Deltoid', 'Biceps (stabilizer)'],
  },
  'Cable Crossover': {
    movementType: 'Isolation',
    description: 'Cable fly variation that provides constant tension throughout the range of motion.',
    primaryMuscles: ['Pectoralis Major'],
    secondaryMuscles: ['Anterior Deltoid'],
  },
  'Push-Up': {
    movementType: 'Compound',
    description: 'Classic bodyweight pushing movement. Highly versatile based on hand position and elevation.',
    primaryMuscles: ['Pectoralis Major'],
    secondaryMuscles: ['Triceps', 'Anterior Deltoid', 'Core'],
  },
  'Chest Press Machine': {
    movementType: 'Compound',
    description: 'Machine-guided press — ideal for beginners or finishing a chest session safely.',
    primaryMuscles: ['Pectoralis Major'],
    secondaryMuscles: ['Triceps', 'Anterior Deltoid'],
  },
  // ── Back ──────────────────────────────────────────────────────────────────
  'Deadlift': {
    movementType: 'Compound',
    description: 'The ultimate full-body strength movement. Lift a loaded barbell from the floor to lockout.',
    primaryMuscles: ['Erector Spinae', 'Glutes', 'Hamstrings'],
    secondaryMuscles: ['Trapezius', 'Latissimus Dorsi', 'Forearms', 'Quadriceps'],
  },
  'Barbell Row': {
    movementType: 'Compound',
    description: 'Horizontal pull that builds thickness in the mid-back. Requires good hip hinge mechanics.',
    primaryMuscles: ['Latissimus Dorsi', 'Rhomboids', 'Mid Trapezius'],
    secondaryMuscles: ['Biceps', 'Posterior Deltoid', 'Erector Spinae'],
  },
  'Pull-Up': {
    movementType: 'Compound',
    description: 'Overhand-grip bodyweight pull. One of the best exercises for lat width.',
    primaryMuscles: ['Latissimus Dorsi'],
    secondaryMuscles: ['Biceps', 'Posterior Deltoid', 'Rhomboids'],
  },
  'Chin-Up': {
    movementType: 'Compound',
    description: 'Underhand-grip pull that incorporates more biceps than the standard pull-up.',
    primaryMuscles: ['Latissimus Dorsi', 'Biceps'],
    secondaryMuscles: ['Posterior Deltoid', 'Rhomboids'],
  },
  'Lat Pulldown': {
    movementType: 'Compound',
    description: 'Cable pull mimicking the pull-up pattern — great for developing lat width.',
    primaryMuscles: ['Latissimus Dorsi'],
    secondaryMuscles: ['Biceps', 'Posterior Deltoid'],
  },
  'Seated Cable Row': {
    movementType: 'Compound',
    description: 'Horizontal cable pull focused on mid-back thickness. Chest up, elbows close to body.',
    primaryMuscles: ['Rhomboids', 'Mid Trapezius'],
    secondaryMuscles: ['Latissimus Dorsi', 'Biceps', 'Posterior Deltoid'],
  },
  'T-Bar Row': {
    movementType: 'Compound',
    description: 'Landmine barbell variation allowing heavy loads with neutral or overhand grip.',
    primaryMuscles: ['Latissimus Dorsi', 'Rhomboids'],
    secondaryMuscles: ['Biceps', 'Erector Spinae'],
  },
  'Single-Arm Dumbbell Row': {
    movementType: 'Compound',
    description: 'Unilateral row allowing greater range of motion and independent side correction.',
    primaryMuscles: ['Latissimus Dorsi', 'Rhomboids'],
    secondaryMuscles: ['Biceps', 'Posterior Deltoid'],
  },
  // ── Shoulders ─────────────────────────────────────────────────────────────
  'Overhead Press (OHP)': {
    movementType: 'Compound',
    description: 'Barbell press from shoulders to overhead lockout. A fundamental upper-body strength movement.',
    primaryMuscles: ['Anterior Deltoid', 'Lateral Deltoid'],
    secondaryMuscles: ['Triceps', 'Upper Trapezius', 'Core'],
  },
  'Dumbbell Shoulder Press': {
    movementType: 'Compound',
    description: 'Overhead press with dumbbells, seated or standing, allowing greater range than barbells.',
    primaryMuscles: ['Anterior Deltoid', 'Lateral Deltoid'],
    secondaryMuscles: ['Triceps', 'Upper Trapezius'],
  },
  'Lateral Raise': {
    movementType: 'Isolation',
    description: 'Isolation exercise for the lateral deltoid — essential for building shoulder width.',
    primaryMuscles: ['Lateral Deltoid'],
    secondaryMuscles: ['Anterior Deltoid', 'Upper Trapezius'],
  },
  'Front Raise': {
    movementType: 'Isolation',
    description: 'Raise a dumbbell or plate to the front, isolating the anterior deltoid.',
    primaryMuscles: ['Anterior Deltoid'],
    secondaryMuscles: ['Lateral Deltoid', 'Upper Trapezius'],
  },
  'Rear Delt Fly': {
    movementType: 'Isolation',
    description: 'Incline fly that targets the often-neglected posterior deltoid and improves posture.',
    primaryMuscles: ['Posterior Deltoid'],
    secondaryMuscles: ['Rhomboids', 'Mid Trapezius'],
  },
  'Arnold Press': {
    movementType: 'Compound',
    description: 'Popularized by Schwarzenegger — rotating dumbbell press that works all three delt heads.',
    primaryMuscles: ['Anterior Deltoid', 'Lateral Deltoid'],
    secondaryMuscles: ['Posterior Deltoid', 'Triceps'],
  },
  // ── Biceps ────────────────────────────────────────────────────────────────
  'Barbell Curl': {
    movementType: 'Isolation',
    description: 'Classic bilateral curl allowing heavier loads. Keep elbows pinned to your sides.',
    primaryMuscles: ['Biceps Brachii'],
    secondaryMuscles: ['Brachialis', 'Brachioradialis'],
  },
  'Dumbbell Curl': {
    movementType: 'Isolation',
    description: 'Unilateral curl allowing wrist supination at the top for peak contraction. A bicep staple.',
    primaryMuscles: ['Biceps Brachii'],
    secondaryMuscles: ['Brachialis', 'Brachioradialis'],
  },
  'Hammer Curl': {
    movementType: 'Isolation',
    description: 'Neutral-grip curl that targets the brachialis and brachioradialis for arm thickness.',
    primaryMuscles: ['Brachialis', 'Brachioradialis'],
    secondaryMuscles: ['Biceps Brachii'],
  },
  'Preacher Curl': {
    movementType: 'Isolation',
    description: 'Performed on a preacher bench to eliminate swinging and maximize bicep isolation.',
    primaryMuscles: ['Biceps Brachii'],
    secondaryMuscles: ['Brachialis'],
  },
  'Cable Curl': {
    movementType: 'Isolation',
    description: 'Cable provides constant tension throughout the curl, especially at the bottom.',
    primaryMuscles: ['Biceps Brachii'],
    secondaryMuscles: ['Brachialis', 'Brachioradialis'],
  },
  // ── Triceps ───────────────────────────────────────────────────────────────
  'Tricep Pushdown': {
    movementType: 'Isolation',
    description: 'Cable pushdown that isolates the triceps. Use rope or bar attachment.',
    primaryMuscles: ['Triceps Brachii'],
    secondaryMuscles: [],
  },
  'Skull Crusher': {
    movementType: 'Isolation',
    description: 'Lying barbell extension that stretches the long head of the triceps. Control the load.',
    primaryMuscles: ['Triceps Brachii (Long Head)'],
    secondaryMuscles: ['Lateral Head', 'Medial Head'],
  },
  'Close-Grip Bench Press': {
    movementType: 'Compound',
    description: 'Narrow-grip press that shifts emphasis from chest to triceps with greater loading potential.',
    primaryMuscles: ['Triceps Brachii'],
    secondaryMuscles: ['Pectoralis Major', 'Anterior Deltoid'],
  },
  'Overhead Tricep Extension': {
    movementType: 'Isolation',
    description: 'Overhead dumbbell or cable extension — stretches the long head for complete tricep development.',
    primaryMuscles: ['Triceps Brachii (Long Head)'],
    secondaryMuscles: [],
  },
  'Tricep Dips': {
    movementType: 'Compound',
    description: 'Bodyweight dips on parallel bars. Can add weight for progressive overload.',
    primaryMuscles: ['Triceps Brachii'],
    secondaryMuscles: ['Pectoralis Major', 'Anterior Deltoid'],
  },
  // ── Core ──────────────────────────────────────────────────────────────────
  'Plank': {
    movementType: 'Compound',
    description: 'Isometric exercise that develops core stability and anti-extension strength.',
    primaryMuscles: ['Rectus Abdominis', 'Transverse Abdominis'],
    secondaryMuscles: ['Obliques', 'Glutes', 'Erector Spinae'],
  },
  'Crunch': {
    movementType: 'Isolation',
    description: 'Short-range spinal flexion working the upper rectus abdominis.',
    primaryMuscles: ['Rectus Abdominis'],
    secondaryMuscles: ['Obliques'],
  },
  'Cable Crunch': {
    movementType: 'Isolation',
    description: 'Kneeling cable crunch for progressive overload on the abdominals.',
    primaryMuscles: ['Rectus Abdominis'],
    secondaryMuscles: ['Obliques'],
  },
  'Hanging Leg Raise': {
    movementType: 'Compound',
    description: 'Hang from a bar and raise legs to 90° or beyond — intense lower abs and hip flexor work.',
    primaryMuscles: ['Rectus Abdominis (Lower)', 'Hip Flexors'],
    secondaryMuscles: ['Obliques', 'Forearms'],
  },
  'Russian Twist': {
    movementType: 'Isolation',
    description: 'Rotational exercise targeting the obliques. Add weight or slow the tempo for intensity.',
    primaryMuscles: ['Obliques'],
    secondaryMuscles: ['Rectus Abdominis', 'Hip Flexors'],
  },
  // ── Quads ─────────────────────────────────────────────────────────────────
  'Squat': {
    movementType: 'Compound',
    description: 'The fundamental lower-body exercise. Back squat with barbell to parallel or below.',
    primaryMuscles: ['Quadriceps', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Erector Spinae', 'Core'],
  },
  'Front Squat': {
    movementType: 'Compound',
    description: 'Bar resting on front delts — demands greater ankle mobility and quad dominance.',
    primaryMuscles: ['Quadriceps'],
    secondaryMuscles: ['Glutes', 'Core', 'Upper Back'],
  },
  'Leg Press': {
    movementType: 'Compound',
    description: 'Machine allows heavy quad loading without spinal compression. Perfect for volume.',
    primaryMuscles: ['Quadriceps'],
    secondaryMuscles: ['Glutes', 'Hamstrings'],
  },
  'Hack Squat': {
    movementType: 'Compound',
    description: 'Machine squat with upright torso that maximizes quad recruitment.',
    primaryMuscles: ['Quadriceps'],
    secondaryMuscles: ['Glutes', 'Hamstrings'],
  },
  'Leg Extension': {
    movementType: 'Isolation',
    description: 'Machine isolation for the quadriceps. Ideal for finishing sets or pre-exhaustion.',
    primaryMuscles: ['Quadriceps'],
    secondaryMuscles: [],
  },
  'Bulgarian Split Squat': {
    movementType: 'Compound',
    description: 'Single-leg squat with rear foot elevated — brutal for quads, glutes, and unilateral balance.',
    primaryMuscles: ['Quadriceps', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Core'],
  },
  'Walking Lunges': {
    movementType: 'Compound',
    description: 'Dynamic lunge pattern that builds quad strength and hip flexor mobility.',
    primaryMuscles: ['Quadriceps', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Core'],
  },
  // ── Hamstrings ────────────────────────────────────────────────────────────
  'Romanian Deadlift (RDL)': {
    movementType: 'Compound',
    description: 'Hip hinge with slight knee bend — the best exercise for hamstring length and strength.',
    primaryMuscles: ['Hamstrings', 'Glutes'],
    secondaryMuscles: ['Erector Spinae', 'Forearms'],
  },
  'Leg Curl': {
    movementType: 'Isolation',
    description: 'Machine isolation for the hamstrings — lying or seated variation.',
    primaryMuscles: ['Hamstrings'],
    secondaryMuscles: ['Gastrocnemius'],
  },
  'Stiff-Leg Deadlift': {
    movementType: 'Compound',
    description: 'Similar to the RDL but with straighter knees for greater hamstring stretch.',
    primaryMuscles: ['Hamstrings'],
    secondaryMuscles: ['Glutes', 'Erector Spinae'],
  },
  // ── Glutes ────────────────────────────────────────────────────────────────
  'Hip Thrust': {
    movementType: 'Compound',
    description: 'Barbell hip thrust braced on a bench — the gold standard for glute hypertrophy.',
    primaryMuscles: ['Glutes'],
    secondaryMuscles: ['Hamstrings', 'Core'],
  },
  'Glute Bridge': {
    movementType: 'Compound',
    description: 'Floor hip extension with bodyweight or band — excellent activation for beginners.',
    primaryMuscles: ['Glutes'],
    secondaryMuscles: ['Hamstrings', 'Core'],
  },
  'Cable Kickback': {
    movementType: 'Isolation',
    description: 'Cable hip extension focusing on peak glute contraction at the top of the movement.',
    primaryMuscles: ['Glutes'],
    secondaryMuscles: ['Hamstrings'],
  },
  // ── Calves ────────────────────────────────────────────────────────────────
  'Standing Calf Raise': {
    movementType: 'Isolation',
    description: 'Standing machine raise targeting the gastrocnemius with a full stretch at the bottom.',
    primaryMuscles: ['Gastrocnemius'],
    secondaryMuscles: ['Soleus'],
  },
  'Seated Calf Raise': {
    movementType: 'Isolation',
    description: 'Seated position flexes the knee, shifting emphasis to the deeper soleus muscle.',
    primaryMuscles: ['Soleus'],
    secondaryMuscles: ['Gastrocnemius'],
  },
  'Donkey Calf Raise': {
    movementType: 'Isolation',
    description: 'Inclined calf raise allowing a very deep gastrocnemius stretch.',
    primaryMuscles: ['Gastrocnemius'],
    secondaryMuscles: ['Soleus'],
  },
  // ── Full Body ─────────────────────────────────────────────────────────────
  'Clean and Press': {
    movementType: 'Compound',
    description: 'Olympic-style lift combining a power clean with an overhead press in one fluid movement.',
    primaryMuscles: ['Glutes', 'Hamstrings', 'Quadriceps', 'Shoulders'],
    secondaryMuscles: ['Trapezius', 'Erector Spinae', 'Triceps', 'Core'],
  },
  'Kettlebell Swing': {
    movementType: 'Compound',
    description: 'Hip-hinge power movement with a kettlebell — develops explosive posterior chain strength.',
    primaryMuscles: ['Glutes', 'Hamstrings'],
    secondaryMuscles: ['Erector Spinae', 'Core', 'Shoulders'],
  },
  'Burpee': {
    movementType: 'Compound',
    description: 'Full-body conditioning exercise combining squat, plank, push-up, and jump.',
    primaryMuscles: ['Full Body'],
    secondaryMuscles: ['Core', 'Cardiovascular System'],
  },
  // ── Cardio ────────────────────────────────────────────────────────────────
  'Treadmill': {
    movementType: 'Compound',
    description: 'Controlled running or walking for cardiovascular conditioning and calorie expenditure.',
    primaryMuscles: ['Cardiovascular System'],
    secondaryMuscles: ['Quadriceps', 'Hamstrings', 'Calves', 'Glutes'],
  },
  'Rowing Machine': {
    movementType: 'Compound',
    description: 'Low-impact full-body cardio engaging legs, back, and arms in a rowing pattern.',
    primaryMuscles: ['Cardiovascular System', 'Back'],
    secondaryMuscles: ['Legs', 'Biceps', 'Core'],
  },
  'Jump Rope': {
    movementType: 'Compound',
    description: 'High-intensity cardio that also improves coordination, footwork, and calf strength.',
    primaryMuscles: ['Cardiovascular System', 'Calves'],
    secondaryMuscles: ['Shoulders', 'Forearms', 'Core'],
  },
};

export function getExerciseMeta(name: string): ExerciseMeta {
  return EXERCISE_META[name] ?? {
    movementType: 'Compound',
    description: 'Custom exercise.',
    primaryMuscles: [],
    secondaryMuscles: [],
  };
}
