import { getAuthSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Navigation } from '@/components/layout/Navigation';

export default async function TabsLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();
  if (!session?.user) redirect('/login');

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navigation />
      {/* Content — offset by sidebar on desktop, padded for bottom nav on mobile */}
      <main className="lg:ml-56 min-h-screen">
        <div className="p-4 lg:p-6 lg:pb-6 pb-safe-nav max-w-5xl">
          {children}
        </div>
      </main>
    </div>
  );
}
