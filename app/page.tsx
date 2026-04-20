import { getAuthSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LoginPage } from '@/components/auth/LoginPage';

export default async function Home() {
  const session = await getAuthSession();
  if (session?.user) redirect('/dashboard');
  return <LoginPage />;
}
