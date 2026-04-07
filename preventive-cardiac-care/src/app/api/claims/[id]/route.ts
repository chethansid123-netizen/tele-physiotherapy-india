import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit-logger';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const claim = await prisma.claim.findUnique({
    where: { id: params.id },
    include: {
      patient: { include: { primaryInsurance: true } },
      provider: { include: { user: true } },
      insurance: true,
      billingRecords: true,
      claimStatusHistory: { orderBy: { changedAt: 'desc' } },
    },
  });

  if (!claim) {
    return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
  }

  return NextResponse.json(claim);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { claimStatus, denialReason, denialCode, paidAmount, notes } = body;

  const existingClaim = await prisma.claim.findUnique({ where: { id: params.id } });

  if (!existingClaim) {
    return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
  }

  const updateData: any = {};
  if (claimStatus) updateData.claimStatus = claimStatus;
  if (denialReason) updateData.denialReason = denialReason;
  if (denialCode) updateData.denialCode = denialCode;
  if (paidAmount !== undefined) {
    updateData.totalPaid = paidAmount;
    updateData.paidDate = new Date();
  }
  if (claimStatus === 'SUBMITTED') {
    updateData.submittedDate = new Date();
  }

  const claim = await prisma.claim.update({
    where: { id: params.id },
    data: updateData,
  });

  await prisma.claimStatusHistory.create({
    data: {
      claimId: claim.id,
      fromStatus: existingClaim.claimStatus,
      toStatus: claimStatus || existingClaim.claimStatus,
      notes: notes || null,
      changedBy: (session.user as any).id,
    },
  });

  if (claimStatus === 'PAID' && paidAmount) {
    await prisma.billingRecord.updateMany({
      where: { claimId: claim.id },
      data: { billingStatus: 'PAID', paidDate: new Date() },
    });
  }

  if (claimStatus === 'DENIED') {
    await prisma.billingRecord.updateMany({
      where: { claimId: claim.id },
      data: { billingStatus: 'DENIED' },
    });
  }

  await logAudit({
    userId: (session.user as any).id,
    action: 'CLAIM_STATUS_CHANGE',
    resource: 'claim',
    resourceId: claim.id,
    details: { from: existingClaim.claimStatus, to: claimStatus, denialReason },
  });

  return NextResponse.json(claim);
}
