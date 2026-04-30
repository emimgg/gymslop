import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await requireAuth();
    const supplements = await prisma.userSupplement.findMany({
      where: { userId: session.user.id },
      orderBy: [{ timing: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });
    return NextResponse.json(supplements);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const { name, isCustom, dose, doseUnit, timing } = await req.json();

    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

    const supplement = await prisma.userSupplement.upsert({
      where: { userId_name: { userId, name } },
      update: { dose, doseUnit, timing: timing ?? null },
      create: { userId, name, isCustom: isCustom ?? false, dose: dose ?? null, doseUnit: doseUnit ?? null, timing: timing ?? null },
    });

    return NextResponse.json(supplement, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
