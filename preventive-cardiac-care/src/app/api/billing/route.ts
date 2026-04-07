import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { billingSchema } from '@/lib/validators';
import { logAudit } from '@/lib/audit-logger';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const patientId = searchParams.get('patientId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  const where: any = {};
  if (status) where.billingStatus = status;
  if (patientId) where.patientId = patientId;
  if (startDate || endDate) {
    where.dateOfService = {};
    if (startDate) where.dateOfService.gte = new Date(startDate);
    if (endDate) where.dateOfService.lte = new Date(endDate);
  }

  const [records, total] = await Promise.all([
    prisma.billingRecord.findMany({
      where,
      include: {
        encounter: true,
        patient: { select: { firstName: true, lastName: true, mrn: true } },
        provider: { include: { user: { select: { firstName: true, lastName: true } } } },
        claim: { select: { id: true, claimNumber: true, claimStatus: true } },
      },
      orderBy: { dateOfService: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.billingRecord.count({ where }),
  ]);

  return NextResponse.json({
    records,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = billingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  const encounter = await prisma.encounter.findUnique({
    where: { id: parsed.data.encounterId },
    include: { patient: true },
  });

  if (!encounter) {
    return NextResponse.json({ error: 'Encounter not found' }, { status: 404 });
  }

  const cptCode = await prisma.cptCode.findUnique({
    where: { code: parsed.data.cptCode },
  });

  const billingRecord = await prisma.billingRecord.create({
    data: {
      encounterId: parsed.data.encounterId,
      patientId: encounter.patientId,
      providerId: encounter.providerId,
      cptCode: parsed.data.cptCode,
      cptDescription: cptCode?.description || parsed.data.cptCode,
      modifiers: parsed.data.modifiers || [],
      icdCodes: parsed.data.icdCodes,
      placeOfService: encounter.placeOfService,
      unitsOfService: parsed.data.unitsOfService,
      chargeAmount: parsed.data.chargeAmount,
      billingStatus: 'READY_TO_BILL',
      dateOfService: encounter.encounterDate,
      autoSuggested: false,
    },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: 'CREATE',
    resource: 'billing_record',
    resourceId: billingRecord.id,
    details: { cptCode: parsed.data.cptCode, chargeAmount: parsed.data.chargeAmount },
  });

  return NextResponse.json(billingRecord, { status: 201 });
}
