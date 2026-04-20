export type SetTechniqueKey =
  | 'NORMAL'
  | 'DROP_SET'
  | 'REST_PAUSE'
  | 'PARTIAL_REPS'
  | 'MECHANICAL_DROP'
  | 'SUPERSET'
  | 'GIANT_SET'
  | 'MYO_REPS'
  | 'ONE_HALF_REPS'
  | 'TEMPO'
  | 'FORCED_REPS'
  | 'CLUSTER_SET';

export interface TechniqueStyle {
  rowBg: string;
  rowBorder: string;
  badgeClass: string;
  dotClass: string;
  hasTempo: boolean;
  labelKey: string;
  descKey: string;
}

export const TECHNIQUE_ORDER: SetTechniqueKey[] = [
  'NORMAL',
  'DROP_SET',
  'REST_PAUSE',
  'PARTIAL_REPS',
  'MECHANICAL_DROP',
  'SUPERSET',
  'GIANT_SET',
  'MYO_REPS',
  'ONE_HALF_REPS',
  'TEMPO',
  'FORCED_REPS',
  'CLUSTER_SET',
];

export const TECHNIQUE_STYLES: Record<SetTechniqueKey, TechniqueStyle> = {
  NORMAL: {
    rowBg: '', rowBorder: '',
    badgeClass: 'bg-dark-muted border border-dark-border text-slate-400',
    dotClass: 'bg-slate-600',
    hasTempo: false, labelKey: 'tech.NORMAL', descKey: 'tech.desc.NORMAL',
  },
  DROP_SET: {
    rowBg: 'bg-neon-orange/5', rowBorder: 'border-l-2 border-neon-orange',
    badgeClass: 'bg-neon-orange/15 border border-neon-orange/30 text-neon-orange',
    dotClass: 'bg-neon-orange',
    hasTempo: false, labelKey: 'tech.DROP_SET', descKey: 'tech.desc.DROP_SET',
  },
  REST_PAUSE: {
    rowBg: 'bg-neon-purple/5', rowBorder: 'border-l-2 border-neon-purple',
    badgeClass: 'bg-neon-purple/15 border border-neon-purple/30 text-neon-purple',
    dotClass: 'bg-neon-purple',
    hasTempo: false, labelKey: 'tech.REST_PAUSE', descKey: 'tech.desc.REST_PAUSE',
  },
  PARTIAL_REPS: {
    rowBg: 'bg-neon-yellow/5', rowBorder: 'border-l-2 border-neon-yellow',
    badgeClass: 'bg-neon-yellow/15 border border-neon-yellow/30 text-neon-yellow',
    dotClass: 'bg-neon-yellow',
    hasTempo: false, labelKey: 'tech.PARTIAL_REPS', descKey: 'tech.desc.PARTIAL_REPS',
  },
  MECHANICAL_DROP: {
    rowBg: 'bg-neon-yellow/5', rowBorder: 'border-l-2 border-neon-yellow',
    badgeClass: 'bg-neon-yellow/15 border border-neon-yellow/30 text-neon-yellow',
    dotClass: 'bg-neon-yellow',
    hasTempo: false, labelKey: 'tech.MECHANICAL_DROP', descKey: 'tech.desc.MECHANICAL_DROP',
  },
  SUPERSET: {
    rowBg: 'bg-neon-blue/5', rowBorder: 'border-l-2 border-neon-blue',
    badgeClass: 'bg-neon-blue/15 border border-neon-blue/30 text-neon-blue',
    dotClass: 'bg-neon-blue',
    hasTempo: false, labelKey: 'tech.SUPERSET', descKey: 'tech.desc.SUPERSET',
  },
  GIANT_SET: {
    rowBg: 'bg-neon-cyan/5', rowBorder: 'border-l-2 border-neon-cyan',
    badgeClass: 'bg-neon-cyan/15 border border-neon-cyan/30 text-neon-cyan',
    dotClass: 'bg-neon-cyan',
    hasTempo: false, labelKey: 'tech.GIANT_SET', descKey: 'tech.desc.GIANT_SET',
  },
  MYO_REPS: {
    rowBg: 'bg-neon-red/5', rowBorder: 'border-l-2 border-neon-red',
    badgeClass: 'bg-neon-red/15 border border-neon-red/30 text-neon-red',
    dotClass: 'bg-neon-red',
    hasTempo: false, labelKey: 'tech.MYO_REPS', descKey: 'tech.desc.MYO_REPS',
  },
  ONE_HALF_REPS: {
    rowBg: 'bg-neon-pink/5', rowBorder: 'border-l-2 border-neon-pink',
    badgeClass: 'bg-neon-pink/15 border border-neon-pink/30 text-neon-pink',
    dotClass: 'bg-neon-pink',
    hasTempo: false, labelKey: 'tech.ONE_HALF_REPS', descKey: 'tech.desc.ONE_HALF_REPS',
  },
  TEMPO: {
    rowBg: 'bg-neon-yellow/5', rowBorder: 'border-l-2 border-neon-yellow',
    badgeClass: 'bg-neon-yellow/15 border border-neon-yellow/30 text-neon-yellow',
    dotClass: 'bg-neon-yellow',
    hasTempo: true, labelKey: 'tech.TEMPO', descKey: 'tech.desc.TEMPO',
  },
  FORCED_REPS: {
    rowBg: 'bg-neon-red/5', rowBorder: 'border-l-2 border-neon-red',
    badgeClass: 'bg-neon-red/15 border border-neon-red/30 text-neon-red',
    dotClass: 'bg-neon-red',
    hasTempo: false, labelKey: 'tech.FORCED_REPS', descKey: 'tech.desc.FORCED_REPS',
  },
  CLUSTER_SET: {
    rowBg: 'bg-neon-lime/5', rowBorder: 'border-l-2 border-neon-lime',
    badgeClass: 'bg-neon-lime/15 border border-neon-lime/30 text-neon-lime',
    dotClass: 'bg-neon-lime',
    hasTempo: false, labelKey: 'tech.CLUSTER_SET', descKey: 'tech.desc.CLUSTER_SET',
  },
};
