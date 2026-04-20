import { Header } from '@/components/layout/Header';
import { ProgressClient } from '@/components/progress/ProgressClient';

export default function ProgressPage() {
  return (
    <>
      <Header titleKey="nav.progress" />
      <ProgressClient />
    </>
  );
}
