import { Header } from '@/components/layout/Header';
import { TrophiesClient } from '@/components/trophies/TrophiesClient';

export default function TrophiesPage() {
  return (
    <>
      <Header titleKey="nav.trophies" />
      <TrophiesClient />
    </>
  );
}
