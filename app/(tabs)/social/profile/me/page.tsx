import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function MyProfileRedirect() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true },
  });

  // Redirect to username-based URL if available, otherwise fall back to ID
  redirect(`/social/profile/${user?.username ?? session.user.id}`);
}
