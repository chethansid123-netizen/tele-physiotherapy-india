import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { rpmDeviceDataSchema } from '@/lib/validators';
import { logAudit } from '@/lib/audit-logger';

function checkAbnormalReading(deviceType: string, value: any): boolean {
  switch (deviceType) {
    case 'BLOOD_PRESSURE':
      return (
        value.systolic > 180 || value.systolic < 90 ||
        value.diastolic > 120 || value.diastolic < 60
      );
    case 'PULSE_OXIMETER':
      return value.spo2 < 92 || value.heartRate > 120 || value.heartRate < 50;
    case 'WEIGHT_SCALE':
      return value.changeFromPrevious && Math.abs(value.changeFromPrevious) > 3;
    case 'ECG_MONITOR':
      return value.irregular === true;
    case 'SPIROMETER':
      return value.fev1Percent && value.fev1Percent < 60;
    default:
      return false;
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = rpmDeviceDataSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  const isAbnormal = checkAbnormalReading(parsed.data.deviceType, parsed.data.readingValue);

  const rpmData = await prisma.rpmDeviceData.create({
    data: {
      patientId: parsed.data.patientId,
      deviceType: parsed.data.deviceType,
      readingDate: new Date(parsed.data.readingDate),
      readingValue: parsed.data.readingValue,
      isAbnormal,
      alertTriggered: isAbnormal,
      notes: parsed.data.notes,
      source: parsed.data.source,
    },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: 'CREATE',
    resource: 'rpm_device_data',
    resourceId: rpmData.id,
    details: { deviceType: parsed.data.deviceType, isAbnormal },
  });

  return NextResponse.json(rpmData, { status: 201 });
}
