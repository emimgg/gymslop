import { Header } from '@/components/layout/Header';
import { ProfileClient } from '@/components/social/ProfileClient';

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return (
    <>
      <Header titleKey="nav.profile" />
      <ProfileClient userId={username} />
    </>
  );
}
