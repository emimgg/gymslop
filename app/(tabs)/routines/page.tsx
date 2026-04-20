import { Header } from '@/components/layout/Header';
import { RoutinesClient } from '@/components/routines/RoutinesClient';

export default function RoutinesPage() {
  return (
    <>
      <Header titleKey="nav.routines" />
      <RoutinesClient />
    </>
  );
}
