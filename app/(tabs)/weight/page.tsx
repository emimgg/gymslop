import { Header } from '@/components/layout/Header';
import { WeightClient } from '@/components/weight/WeightClient';

export default function WeightPage() {
  return (
    <>
      <Header titleKey="nav.weight" />
      <WeightClient />
    </>
  );
}
