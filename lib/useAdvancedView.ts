'use client';

import { useQuery } from '@tanstack/react-query';

interface UserProfile {
  advancedView?: boolean;
  weeklyGoalKg?: number | null;
  caloricTarget?: number | null;
  name?: string | null;
}

export function useUserProfile() {
  return useQuery<UserProfile>({
    queryKey: ['user'],
    queryFn: () => fetch('/api/user').then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdvancedView(): boolean {
  const { data } = useUserProfile();
  return data?.advancedView ?? false;
}

export type CalorieStatus = 'deficit' | 'maintenance' | 'surplus';

export function getCalorieStatus(weeklyGoalKg: number | null | undefined): CalorieStatus {
  if (weeklyGoalKg == null) return 'maintenance';
  if (weeklyGoalKg < -0.1) return 'deficit';
  if (weeklyGoalKg > 0.1) return 'surplus';
  return 'maintenance';
}
