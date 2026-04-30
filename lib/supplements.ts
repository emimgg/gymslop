export type SupplementTiming = 'MORNING' | 'PREWORKOUT' | 'POSTWORKOUT' | 'EVENING';

export interface Supplement {
  key: string;
  defaultDose: number;
  doseUnit: 'g' | 'mg' | 'IU' | 'mcg';
  suggestedTiming?: SupplementTiming;
}

export const SUPPLEMENTS: Supplement[] = [
  { key: 'creatine',      defaultDose: 5,     doseUnit: 'g',   suggestedTiming: 'PREWORKOUT' },
  { key: 'whey',          defaultDose: 30,    doseUnit: 'g',   suggestedTiming: 'POSTWORKOUT' },
  { key: 'casein',        defaultDose: 30,    doseUnit: 'g',   suggestedTiming: 'EVENING'     },
  { key: 'preworkout_supp', defaultDose: 10,  doseUnit: 'g',   suggestedTiming: 'PREWORKOUT'  },
  { key: 'caffeine',      defaultDose: 200,   doseUnit: 'mg',  suggestedTiming: 'PREWORKOUT'  },
  { key: 'betaalanine',   defaultDose: 3200,  doseUnit: 'mg',  suggestedTiming: 'PREWORKOUT'  },
  { key: 'citrulline',    defaultDose: 6000,  doseUnit: 'mg',  suggestedTiming: 'PREWORKOUT'  },
  { key: 'bcaa',          defaultDose: 5,     doseUnit: 'g',   suggestedTiming: 'PREWORKOUT'  },
  { key: 'eaa',           defaultDose: 10,    doseUnit: 'g',   suggestedTiming: 'PREWORKOUT'  },
  { key: 'vitamind',      defaultDose: 2000,  doseUnit: 'IU',  suggestedTiming: 'MORNING'     },
  { key: 'magnesium',     defaultDose: 400,   doseUnit: 'mg',  suggestedTiming: 'EVENING'     },
  { key: 'zinc',          defaultDose: 25,    doseUnit: 'mg',  suggestedTiming: 'MORNING'     },
  { key: 'omega3',        defaultDose: 1000,  doseUnit: 'mg',  suggestedTiming: 'MORNING'     },
  { key: 'multivitamin',  defaultDose: 1,     doseUnit: 'g',   suggestedTiming: 'MORNING'     },
  { key: 'melatonin',     defaultDose: 3,     doseUnit: 'mg',  suggestedTiming: 'EVENING'     },
  { key: 'ashwagandha',   defaultDose: 600,   doseUnit: 'mg',  suggestedTiming: 'MORNING'     },
  { key: 'collagen',      defaultDose: 10,    doseUnit: 'g',   suggestedTiming: 'EVENING'     },
  { key: 'glutamine',     defaultDose: 5,     doseUnit: 'g',   suggestedTiming: 'POSTWORKOUT' },
];

export const SUPPLEMENT_TIMINGS: SupplementTiming[] = ['MORNING', 'PREWORKOUT', 'POSTWORKOUT', 'EVENING'];
