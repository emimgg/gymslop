import { NextAuthOptions, getServerSession } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { prisma } from './prisma';

async function generateUsername(userId: string, email: string | null, name: string | null): Promise<string> {
  const base = (email?.split('@')[0] ?? name ?? 'user')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 20) || 'user';
  let candidate = base;
  let attempt = 0;
  while (true) {
    const existing = await prisma.user.findUnique({ where: { username: candidate }, select: { id: true } });
    if (!existing || existing.id === userId) return candidate;
    attempt++;
    candidate = `${base}${attempt}`;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        // `user` is only present on the first sign-in — auto-generate username then
        token.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { username: true, email: true, name: true },
        });
        if (dbUser && !dbUser.username) {
          const username = await generateUsername(user.id, dbUser.email, dbUser.name);
          await prisma.user.update({ where: { id: user.id }, data: { username } });
          token.username = username;
        } else {
          token.username = dbUser?.username ?? null;
        }
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { username?: string | null }).username = token.username as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};

export async function getAuthSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  return session;
}
