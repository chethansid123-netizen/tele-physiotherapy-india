import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate') || new Date(new Date().getFullYear(), 0, 1).toISOString();
  const endDate = searchParams.get('endDate') || new Date().toISOString();

  const revenueByCpt = await prisma.billingRecord.groupBy({
    by: ['cptCode'],
    where: {
      dateOfService: { gte: new Date(startDate), lte: new Date(endDate) },
      billingStatus: { in: ['PAID', 'PARTIALLY_PAID'] },
    },
    _sum: { chargeAmount: true, paidAmount: true },
    _count: true,
  });

  const allRecords = await prisma.billingRecord.findMany({
    where: {
      dateOfService: { gte: new Date(startDate), lte: new Date(endDate) },
    },
    select: {
      dateOfService: true,
      chargeAmount: true,
      paidAmount: true,
      billingStatus: true,
    },
  });

  const revenueByMonth: Record<string, { charged: number; paid: number; count: number }> = {};
  allRecords.forEach((r) => {
    const month = r.dateOfService.toISOString().slice(0, 7);
    if (!revenueByMonth[month]) {
      revenueByMonth[month] = { charged: 0, paid: 0, count: 0 };
    }
    revenueByMonth[month].charged += Number(r.chargeAmount);
    revenueByMonth[month].paid += Number(r.paidAmount || 0);
    revenueByMonth[month].count += 1;
  });

  const claimSummary = await prisma.claim.groupBy({
    by: ['claimStatus'],
    _count: true,
    _sum: { totalCharges: true, totalPaid: true },
  });

  const totals = await prisma.billingRecord.aggregate({
    where: {
      dateOfService: { gte: new Date(startDate), lte: new Date(endDate) },
    },
    _sum: { chargeAmount: true, paidAmount: true, adjustmentAmount: true },
    _count: true,
  });

  return NextResponse.json({
    revenueByCpt,
    revenueByMonth,
    claimSummary,
    totals: {
      totalCharged: Number(totals._sum.chargeAmount || 0),
      totalPaid: Number(totals._sum.paidAmount || 0),
      totalAdjustments: Number(totals._sum.adjustmentAmount || 0),
      totalRecords: totals._count,
      collectionRate: totals._sum.chargeAmount
        ? (Number(totals._sum.paidAmount || 0) / Number(totals._sum.chargeAmount) * 100).toFixed(1)
        : '0',
    },
  });
}
