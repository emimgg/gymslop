import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const { timing, dose, doseUnit, sortOrder } = body;

    const supplement = await prisma.userSupplement.update({
      where: { id, userId: session.user.id },
      data: {
        ...(timing !== undefined && { timing: timing ?? null }),
        ...(dose !== undefined && { dose: dose ?? null }),
        ...(doseUnit !== undefined && { doseUnit }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return NextResponse.json(supplement);
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    await prisma.userSupplement.delete({
      where: { id, userId: session.user.id },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
