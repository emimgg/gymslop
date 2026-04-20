import { Header } from '@/components/layout/Header';
import { LeaderboardClient } from '@/components/social/LeaderboardClient';

export default function LeaderboardPage() {
  return (
    <>
      <Header titleKey="nav.leaderboard" />
      <LeaderboardClient />
    </>
  );
}
