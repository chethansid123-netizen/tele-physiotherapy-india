import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { rpmTimeLogSchema } from '@/lib/validators';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = rpmTimeLogSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  const timeLog = await prisma.rpmTimeLog.create({
    data: {
      patientId: parsed.data.patientId,
      providerId: parsed.data.providerId,
      logDate: new Date(parsed.data.logDate),
      durationMinutes: parsed.data.durationMinutes,
      activityType: parsed.data.activityType,
      notes: parsed.data.notes,
      billingPeriodStart: new Date(parsed.data.billingPeriodStart),
      billingPeriodEnd: new Date(parsed.data.billingPeriodEnd),
    },
  });

  const totalMinutes = await prisma.rpmTimeLog.aggregate({
    where: {
      patientId: parsed.data.patientId,
      billingPeriodStart: new Date(parsed.data.billingPeriodStart),
    },
    _sum: { durationMinutes: true },
  });

  const threshold20Met = (totalMinutes._sum.durationMinutes || 0) >= 20;
  const threshold40Met = (totalMinutes._sum.durationMinutes || 0) >= 40;

  return NextResponse.json({
    timeLog,
    billingStatus: {
      totalMinutesInPeriod: totalMinutes._sum.durationMinutes || 0,
      threshold20Met,
      threshold40Met,
      code99457Eligible: threshold20Met,
      code99458Eligible: threshold40Met,
    },
  });
}
