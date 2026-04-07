import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { suggestCptCodes } from '@/lib/billing-engine';
import { differenceInDays } from 'date-fns';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { encounterId } = await req.json();

  const encounter = await prisma.encounter.findUnique({
    where: { id: encounterId },
    include: { patient: true, provider: true },
  });

  if (!encounter) {
    return NextResponse.json({ error: 'Encounter not found' }, { status: 404 });
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [rpmDataCount, rpmTimeLogs] = await Promise.all([
    prisma.rpmDeviceData.count({
      where: {
        patientId: encounter.patientId,
        readingDate: { gte: thirtyDaysAgo, lte: now },
      },
    }),
    prisma.rpmTimeLog.findMany({
      where: {
        patientId: encounter.patientId,
        billingPeriodStart: { gte: thirtyDaysAgo },
      },
    }),
  ]);

  const rpmDays = await prisma.rpmDeviceData.findMany({
    where: {
      patientId: encounter.patientId,
      readingDate: { gte: thirtyDaysAgo, lte: now },
    },
    select: { readingDate: true },
    distinct: ['readingDate'],
  });

  const rpmMinutes = rpmTimeLogs.reduce((sum, log) => sum + log.durationMinutes, 0);
  const daysSinceSurgery = differenceInDays(now, encounter.patient.surgeryDate);

  const context = {
    encounterType: encounter.encounterType,
    communicationMode: encounter.communicationMode,
    durationMinutes: encounter.durationMinutes || 0,
    surgeryType: encounter.patient.surgeryType,
    daysSinceSurgery,
    hasRpmData: rpmDataCount > 0,
    rpmDaysInPeriod: rpmDays.length,
    rpmMinutesInPeriod: rpmMinutes,
    chronicConditionCount: 1 + (encounter.patient.secondaryDiagnoses?.length || 0),
    ccmMinutesInMonth: rpmMinutes,
    isInGlobalPeriod: daysSinceSurgery <= 90,
  };

  const suggestions = suggestCptCodes(context);

  return NextResponse.json({
    suggestions,
    context: {
      daysSinceSurgery,
      rpmDaysInPeriod: rpmDays.length,
      rpmMinutesInPeriod: rpmMinutes,
      isInGlobalPeriod: daysSinceSurgery <= 90,
    },
  });
}
