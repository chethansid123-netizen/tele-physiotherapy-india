import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit-logger';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const patient = await prisma.patient.findUnique({
    where: { id: params.id },
    include: {
      primaryInsurance: true,
      secondaryInsurance: true,
      encounters: {
        orderBy: { encounterDate: 'desc' },
        take: 10,
        include: { provider: { include: { user: true } } },
      },
      billingRecords: { orderBy: { dateOfService: 'desc' }, take: 20 },
      rpmDeviceData: { orderBy: { readingDate: 'desc' }, take: 30 },
      claims: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });

  if (!patient) {
    return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
  }

  await logAudit({
    userId: (session.user as any).id,
    action: 'PHI_ACCESS',
    resource: 'patient',
    resourceId: patient.id,
    details: { mrn: patient.mrn },
  });

  return NextResponse.json(patient);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  const patient = await prisma.patient.update({
    where: { id: params.id },
    data: {
      ...body,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
      surgeryDate: body.surgeryDate ? new Date(body.surgeryDate) : undefined,
    },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: 'UPDATE',
    resource: 'patient',
    resourceId: patient.id,
    details: { fields: Object.keys(body) },
  });

  return NextResponse.json(patient);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const patient = await prisma.patient.update({
    where: { id: params.id },
    data: { isActive: false },
  });

  await logAudit({
    userId: (session.user as any).id,
    action: 'DELETE',
    resource: 'patient',
    resourceId: patient.id,
  });

  return NextResponse.json({ success: true });
}
