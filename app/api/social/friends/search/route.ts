import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const q = new URL(req.url).searchParams.get('q')?.trim() ?? '';

    if (q.length < 2) return NextResponse.json({ users: [] });

    const existingFriendships = await prisma.friendship.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      select: { senderId: true, receiverId: true },
    });
    const knownIds = new Set<string>([userId]);
    for (const f of existingFriendships) {
      knownIds.add(f.senderId);
      knownIds.add(f.receiverId);
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { notIn: Array.from(knownIds) } },
          {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: { id: true, name: true, email: true, image: true, level: true },
      take: 10,
    });

    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
