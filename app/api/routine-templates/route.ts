import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const templates = await prisma.routineTemplate.findMany({
    include: {
      days: {
        orderBy: { dayOfWeek: 'asc' },
        include: {
          exercises: {
            orderBy: { order: 'asc' },
            include: { exercise: true },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(templates);
}
