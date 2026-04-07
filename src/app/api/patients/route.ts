import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { patientSchema } from '@/lib/validators';
import { logAudit } from '@/lib/audit-logger';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';
  const surgeryType = searchParams.get('surgeryType') || '';
  const riskLevel = searchParams.get('riskLevel') || '';

  const where: any = { isActive: true };

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { mrn: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (surgeryType) where.surgeryType = surgeryType;
  if (riskLevel) where.riskLevel = riskLevel;

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      include: {
        primaryInsurance: true,
        _count: { select: { encounters: true, billingRecords: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.patient.count({ where }),
  ]);

  await logAudit({
    userId: (session.user as any).id,
    action: 'READ',
    resource: 'patient',
    details: { action: 'list', count: patients.length },
  });

  return NextResponse.json({
    patients,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = patientSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  const lastPatient = await prisma.patient.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { mrn: true },
  });
  const nextMrnNum = lastPatient
    ? parseInt(lastPatient.mrn.replace('MRN-', '')) + 1
    : 100001;
  const mrn = `MRN-${nextMrnNum}`;

  const patient = await prisma.patient.create({
    data: {
      ...parsed.data,
      mrn,
      dateOfBirth: new Date(parsed.data.dateOfBirth),
      surgeryDate: new Date(parsed.data.surgeryDate),
      secondaryDiagnoses: parsed.data.secondaryDiagnoses || [],
    },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: 'CREATE',
    resource: 'patient',
    resourceId: patient.id,
    details: { mrn: patient.mrn },
  });

  return NextResponse.json(patient, { status: 201 });
}
