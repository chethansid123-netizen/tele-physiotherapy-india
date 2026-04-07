import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { encounterSchema } from '@/lib/validators';
import { logAudit } from '@/lib/audit-logger';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get('patientId');
  const providerId = searchParams.get('providerId');
  const status = searchParams.get('status');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  const where: any = {};
  if (patientId) where.patientId = patientId;
  if (providerId) where.providerId = providerId;
  if (status) where.status = status;
  if (startDate || endDate) {
    where.encounterDate = {};
    if (startDate) where.encounterDate.gte = new Date(startDate);
    if (endDate) where.encounterDate.lte = new Date(endDate);
  }

  const [encounters, total] = await Promise.all([
    prisma.encounter.findMany({
      where,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
        provider: { include: { user: { select: { firstName: true, lastName: true } } } },
        billingRecords: true,
      },
      orderBy: { encounterDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.encounter.count({ where }),
  ]);

  return NextResponse.json({
    encounters,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = encounterSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  const data = parsed.data;

  let durationMinutes = data.durationMinutes;
  if (!durationMinutes && data.startTime && data.endTime) {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
  }

  const encounter = await prisma.encounter.create({
    data: {
      patientId: data.patientId,
      providerId: data.providerId,
      encounterDate: new Date(data.encounterDate),
      startTime: new Date(data.startTime),
      endTime: data.endTime ? new Date(data.endTime) : null,
      durationMinutes,
      encounterType: data.encounterType,
      communicationMode: data.communicationMode,
      placeOfService: data.placeOfService,
      chiefComplaint: data.chiefComplaint,
      subjective: data.subjective,
      objective: data.objective,
      assessment: data.assessment,
      plan: data.plan,
      vitalSigns: data.vitalSigns || undefined,
      status: 'COMPLETED',
    },
    include: {
      patient: true,
      provider: { include: { user: true } },
    },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: 'CREATE',
    resource: 'encounter',
    resourceId: encounter.id,
    details: { patientId: data.patientId, encounterType: data.encounterType },
  });

  return NextResponse.json(encounter, { status: 201 });
}
