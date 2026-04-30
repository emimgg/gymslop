export type SupplementTiming = 'MORNING' | 'PREWORKOUT' | 'POSTWORKOUT' | 'EVENING' | 'ANYTIME';
export type SupplementCategory = 'performance' | 'recovery' | 'health';

export interface Supplement {
  key: string;
  timing: SupplementTiming;
  category: SupplementCategory;
  defaultDose: number;
  doseUnit: 'g' | 'mg' | 'IU' | 'mcg';
}

export const SUPPLEMENTS: Supplement[] = [
  // Morning — health & hormones
  { key: 'vitamind',    timing: 'MORNING',    category: 'health',       defaultDose: 2000,  doseUnit: 'IU'  },
  { key: 'omega3',      timing: 'MORNING',    category: 'health',       defaultDose: 1000,  doseUnit: 'mg'  },
  { key: 'multivitamin',timing: 'MORNING',    category: 'health',       defaultDose: 1,     doseUnit: 'g'   },
  { key: 'zinc',        timing: 'MORNING',    category: 'health',       defaultDose: 25,    doseUnit: 'mg'  },
  { key: 'ashwagandha', timing: 'MORNING',    category: 'health',       defaultDose: 600,   doseUnit: 'mg'  },

  // Pre-workout — performance
  { key: 'caffeine',    timing: 'PREWORKOUT', category: 'performance',  defaultDose: 200,   doseUnit: 'mg'  },
  { key: 'preworkout_supp', timing: 'PREWORKOUT', category: 'performance', defaultDose: 10, doseUnit: 'g'   },
  { key: 'citrulline',  timing: 'PREWORKOUT', category: 'performance',  defaultDose: 6000,  doseUnit: 'mg'  },
  { key: 'betaalanine', timing: 'PREWORKOUT', category: 'performance',  defaultDose: 3200,  doseUnit: 'mg'  },
  { key: 'eaa',         timing: 'PREWORKOUT', category: 'performance',  defaultDose: 10,    doseUnit: 'g'   },
  { key: 'bcaa',        timing: 'PREWORKOUT', category: 'performance',  defaultDose: 5,     doseUnit: 'g'   },
  { key: 'creatine',    timing: 'PREWORKOUT', category: 'performance',  defaultDose: 5,     doseUnit: 'g'   },

  // Post-workout — recovery
  { key: 'whey',        timing: 'POSTWORKOUT',category: 'recovery',     defaultDose: 30,    doseUnit: 'g'   },
  { key: 'glutamine',   timing: 'POSTWORKOUT',category: 'recovery',     defaultDose: 5,     doseUnit: 'g'   },

  // Evening — sleep & recovery
  { key: 'magnesium',   timing: 'EVENING',    category: 'health',       defaultDose: 400,   doseUnit: 'mg'  },
  { key: 'casein',      timing: 'EVENING',    category: 'recovery',     defaultDose: 30,    doseUnit: 'g'   },
  { key: 'melatonin',   timing: 'EVENING',    category: 'health',       defaultDose: 3,     doseUnit: 'mg'  },
  { key: 'collagen',    timing: 'EVENING',    category: 'recovery',     defaultDose: 10,    doseUnit: 'g'   },
];
