import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { claimSchema } from '@/lib/validators';
import { logAudit } from '@/lib/audit-logger';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  const where: any = {};
  if (status) where.claimStatus = status;

  const [claims, total] = await Promise.all([
    prisma.claim.findMany({
      where,
      include: {
        patient: { select: { firstName: true, lastName: true, mrn: true } },
        provider: { include: { user: { select: { firstName: true, lastName: true } } } },
        insurance: { select: { payerName: true, payerId: true } },
        billingRecords: true,
        _count: { select: { billingRecords: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.claim.count({ where }),
  ]);

  return NextResponse.json({
    claims,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = claimSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  const billingRecords = await prisma.billingRecord.findMany({
    where: {
      id: { in: parsed.data.billingRecordIds },
      billingStatus: 'READY_TO_BILL',
    },
  });

  if (billingRecords.length === 0) {
    return NextResponse.json({ error: 'No billable records found' }, { status: 400 });
  }

  const totalCharges = billingRecords.reduce(
    (sum, r) => sum + Number(r.chargeAmount),
    0
  );

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const claimNumber = `CLM-${today}-${uuidv4().slice(0, 4).toUpperCase()}`;

  const claim = await prisma.claim.create({
    data: {
      claimNumber,
      patientId: parsed.data.patientId,
      providerId: parsed.data.providerId,
      insuranceId: parsed.data.insuranceId,
      totalCharges,
      claimStatus: 'DRAFT',
      referringProviderNpi: parsed.data.referringProviderNpi,
      facilityName: parsed.data.facilityName,
      facilityNpi: parsed.data.facilityNpi,
      billingRecords: {
        connect: billingRecords.map((r) => ({ id: r.id })),
      },
    },
    include: {
      billingRecords: true,
      patient: true,
      provider: { include: { user: true } },
      insurance: true,
    },
  });

  await prisma.billingRecord.updateMany({
    where: { id: { in: billingRecords.map((r) => r.id) } },
    data: { billingStatus: 'BILLED', billedDate: new Date() },
  });

  await prisma.claimStatusHistory.create({
    data: {
      claimId: claim.id,
      toStatus: 'DRAFT',
      notes: 'Claim created',
      changedBy: (session.user as any).id,
    },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: 'CLAIM_SUBMIT',
    resource: 'claim',
    resourceId: claim.id,
    details: { claimNumber, totalCharges, lineItems: billingRecords.length },
  });

  return NextResponse.json(claim, { status: 201 });
}
