import {
  Dumbbell, MoveVertical, ArrowUp, Cable,
  Zap, Hand, Target, Footprints,
  Activity, Flame, PersonStanding, Weight, Heart,
} from 'lucide-react';
import type React from 'react';

export type NeonColor = 'cyan' | 'green' | 'yellow' | 'pink' | 'purple' | 'orange' | 'red' | 'blue';

export interface MgConfig {
  color: NeonColor;
  Icon: React.FC<{ size?: number; className?: string }>;
  labelKey: string;
  order: number;
}

export const MG_CONFIG: Record<string, MgConfig> = {
  CHEST:      { color: 'cyan',   Icon: Dumbbell,       labelKey: 'muscle.CHEST',      order: 0  },
  BACK:       { color: 'green',  Icon: MoveVertical,   labelKey: 'muscle.BACK',       order: 1  },
  SHOULDERS:  { color: 'yellow', Icon: ArrowUp,        labelKey: 'muscle.SHOULDERS',  order: 2  },
  NECK:       { color: 'pink',   Icon: Activity,       labelKey: 'muscle.NECK',       order: 3  },
  BICEPS:     { color: 'pink',   Icon: Cable,          labelKey: 'muscle.BICEPS',     order: 5  },
  TRICEPS:    { color: 'orange', Icon: Zap,            labelKey: 'muscle.TRICEPS',    order: 6  },
  FOREARMS:   { color: 'yellow', Icon: Hand,           labelKey: 'muscle.FOREARMS',   order: 7  },
  CORE:       { color: 'orange', Icon: Target,         labelKey: 'muscle.CORE',       order: 8  },
  QUADS:      { color: 'purple', Icon: Footprints,     labelKey: 'muscle.QUADS',      order: 9  },
  HAMSTRINGS: { color: 'purple', Icon: Activity,       labelKey: 'muscle.HAMSTRINGS', order: 10 },
  GLUTES:     { color: 'red',    Icon: Flame,          labelKey: 'muscle.GLUTES',     order: 11 },
  CALVES:     { color: 'blue',   Icon: PersonStanding, labelKey: 'muscle.CALVES',     order: 12 },
  FULL_BODY:  { color: 'green',  Icon: Weight,         labelKey: 'muscle.FULL_BODY',  order: 13 },
  CARDIO:     { color: 'blue',   Icon: Heart,          labelKey: 'muscle.CARDIO',     order: 14 },
};

export const COLOR_STYLES: Record<NeonColor, {
  text: string; border: string; bg: string; headerBg: string; badge: string; dot: string;
}> = {
  cyan:   { text: 'text-neon-cyan',   border: 'border-neon-cyan/40',   bg: 'bg-neon-cyan/10',   headerBg: 'bg-neon-cyan/5',   badge: 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30',     dot: 'bg-neon-cyan'   },
  green:  { text: 'text-neon-green',  border: 'border-neon-green/40',  bg: 'bg-neon-green/10',  headerBg: 'bg-neon-green/5',  badge: 'bg-neon-green/15 text-neon-green border border-neon-green/30',  dot: 'bg-neon-green'  },
  yellow: { text: 'text-neon-yellow', border: 'border-neon-yellow/40', bg: 'bg-neon-yellow/10', headerBg: 'bg-neon-yellow/5', badge: 'bg-neon-yellow/15 text-neon-yellow border border-neon-yellow/30', dot: 'bg-neon-yellow' },
  pink:   { text: 'text-neon-pink',   border: 'border-neon-pink/40',   bg: 'bg-neon-pink/10',   headerBg: 'bg-neon-pink/5',   badge: 'bg-neon-pink/15 text-neon-pink border border-neon-pink/30',     dot: 'bg-neon-pink'   },
  purple: { text: 'text-neon-purple', border: 'border-neon-purple/40', bg: 'bg-neon-purple/10', headerBg: 'bg-neon-purple/5', badge: 'bg-neon-purple/15 text-neon-purple border border-neon-purple/30', dot: 'bg-neon-purple' },
  orange: { text: 'text-neon-orange', border: 'border-neon-orange/40', bg: 'bg-neon-orange/10', headerBg: 'bg-neon-orange/5', badge: 'bg-neon-orange/15 text-neon-orange border border-neon-orange/30', dot: 'bg-neon-orange' },
  red:    { text: 'text-neon-red',    border: 'border-neon-red/40',    bg: 'bg-neon-red/10',    headerBg: 'bg-neon-red/5',    badge: 'bg-neon-red/15 text-neon-red border border-neon-red/30',         dot: 'bg-neon-red'    },
  blue:   { text: 'text-neon-blue',   border: 'border-neon-blue/40',   bg: 'bg-neon-blue/10',   headerBg: 'bg-neon-blue/5',   badge: 'bg-neon-blue/15 text-neon-blue border border-neon-blue/30',     dot: 'bg-neon-blue'   },
};
