import { Header } from '@/components/layout/Header';
import { SocialClient } from '@/components/social/SocialClient';

export default function SocialPage() {
  return (
    <>
      <Header titleKey="nav.social" />
      <SocialClient />
    </>
  );
}
