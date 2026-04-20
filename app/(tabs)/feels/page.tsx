import { Header } from '@/components/layout/Header';
import { FeelsClient } from '@/components/feels/FeelsClient';

export default function FeelsPage() {
  return (
    <>
      <Header titleKey="nav.feels" />
      <FeelsClient />
    </>
  );
}
