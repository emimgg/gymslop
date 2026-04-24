import { NextResponse } from 'next/server';
import { encode } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { GUEST_USER_ID } from '@/lib/auth';

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { id: GUEST_USER_ID },
    select: { id: true, name: true, email: true, image: true, username: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'Seed user not found — run npm run db:seed' }, { status: 500 });
  }

  const secret = process.env.NEXTAUTH_SECRET!;
  const now = Math.floor(Date.now() / 1000);

  const token = await encode({
    secret,
    token: {
      sub: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      picture: user.image,
      username: user.username,
      iat: now,
      exp: now + 30 * 24 * 60 * 60, // 30 days
      jti: crypto.randomUUID(),
    },
    maxAge: 30 * 24 * 60 * 60,
  });

  const res = NextResponse.redirect(new URL('/dashboard', process.env.NEXTAUTH_URL ?? 'http://localhost:3000'));

  // NextAuth v4 JWT cookie name (non-secure in dev, secure in prod)
  const cookieName = 'next-auth.session-token';
  res.cookies.set(cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
    secure: false,
  });

  return res;
}
