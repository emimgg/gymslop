import { Header } from '@/components/layout/Header';
import { DashboardClient } from '@/components/dashboard/DashboardClient';

export default function DashboardPage() {
  return (
    <>
      <Header titleKey="nav.dashboard" />
      <DashboardClient />
    </>
  );
}
