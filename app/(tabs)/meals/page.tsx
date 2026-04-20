import { Header } from '@/components/layout/Header';
import { MealsClient } from '@/components/meals/MealsClient';

export default function MealsPage() {
  return (
    <>
      <Header titleKey="nav.meals" />
      <MealsClient />
    </>
  );
}
