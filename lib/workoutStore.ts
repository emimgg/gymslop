import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface WorkoutSetEntry {
  setNumber: number;
  reps: number;
  weight: number;
  done: boolean;
  technique: string;
  attachedTechnique?: string; // intensity technique modifier attached to this set
  tempo: string;
  targetRIR?: number;
  targetRPE?: number;
  actualRIR?: number;
  actualRPE?: number;
}

export interface WorkoutExercise {
  exerciseId: string;
  targetSets: number;
  targetReps: number;
  targetWeight: number | null;
  setTechniques?: string[];
  targetRIR?: number;
  targetRPE?: number;
  exercise: { id: string; name: string; muscleGroup: string };
}

export interface ActiveWorkout {
  routine: { id: string; name: string };
  day: { dayOfWeek: number; exercises: WorkoutExercise[] };
  isQuick: boolean;
  startedAt: number; // Date.now()
  exercises: WorkoutExercise[];
  sets: Record<string, WorkoutSetEntry[]>;
}

interface WorkoutStore {
  activeWorkout: ActiveWorkout | null;
  isMinimized: boolean;
  startWorkout: (
    routine: { id: string; name: string },
    day: { dayOfWeek: number; exercises: WorkoutExercise[] },
    isQuick: boolean,
    initialExercises: WorkoutExercise[],
    initialSets: Record<string, WorkoutSetEntry[]>,
  ) => void;
  updateWorkoutState: (exercises: WorkoutExercise[], sets: Record<string, WorkoutSetEntry[]>) => void;
  minimizeWorkout: () => void;
  expandWorkout: () => void;
  clearWorkout: () => void;
}

const ssrSafeStorage = createJSONStorage(() => {
  if (typeof window === 'undefined') {
    return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  }
  return localStorage;
});

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set) => ({
      activeWorkout: null,
      isMinimized: false,

      startWorkout: (routine, day, isQuick, initialExercises, initialSets) => {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('gymtracker:workoutActive', '1');
        }
        set({
          activeWorkout: { routine, day, isQuick, startedAt: Date.now(), exercises: initialExercises, sets: initialSets },
          isMinimized: false,
        });
      },

      updateWorkoutState: (exercises, sets) =>
        set((state) =>
          state.activeWorkout ? { activeWorkout: { ...state.activeWorkout, exercises, sets } } : {}
        ),

      minimizeWorkout: () => set({ isMinimized: true }),

      expandWorkout: () => {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('gymtracker:workoutActive', '1');
        }
        set({ isMinimized: false });
      },

      clearWorkout: () => {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('gymtracker:workoutActive');
        }
        set({ activeWorkout: null, isMinimized: false });
      },
    }),
    { name: 'gymtracker:activeWorkout', storage: ssrSafeStorage }
  )
);
