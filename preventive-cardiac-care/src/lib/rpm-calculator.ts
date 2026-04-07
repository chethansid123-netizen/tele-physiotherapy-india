import prisma from './prisma';

interface RpmBillingPeriodSummary {
  patientId: string;
  periodStart: Date;
  periodEnd: Date;
  totalDeviceDataDays: number;
  totalClinicalMinutes: number;
  eligibleCodes: {
    code: string;
    description: string;
    eligible: boolean;
    reason: string;
    estimatedReimbursement: number;
  }[];
  totalEstimatedReimbursement: number;
}

export async function calculateRpmBilling(
  patientId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<RpmBillingPeriodSummary> {
  const deviceData = await prisma.rpmDeviceData.findMany({
    where: {
      patientId,
      readingDate: { gte: periodStart, lte: periodEnd },
    },
    select: { readingDate: true },
  });

  const uniqueDays = new Set(
    deviceData.map((d) => d.readingDate.toISOString().slice(0, 10))
  );
  const totalDeviceDataDays = uniqueDays.size;

  const timeLogs = await prisma.rpmTimeLog.findMany({
    where: {
      patientId,
      billingPeriodStart: periodStart,
    },
  });

  const totalClinicalMinutes = timeLogs.reduce(
    (sum, log) => sum + log.durationMinutes,
    0
  );

  const eligibleCodes = [];

  eligibleCodes.push({
    code: '99454',
    description: 'RPM device supply & daily recordings',
    eligible: totalDeviceDataDays >= 16,
    reason: totalDeviceDataDays >= 16
      ? `${totalDeviceDataDays} days of data recorded (meets 16-day threshold)`
      : `Only ${totalDeviceDataDays} of 16 required days recorded`,
    estimatedReimbursement: totalDeviceDataDays >= 16 ? 60 : 0,
  });

  eligibleCodes.push({
    code: '99457',
    description: 'RPM treatment management, first 20 min',
    eligible: totalClinicalMinutes >= 20,
    reason: totalClinicalMinutes >= 20
      ? `${totalClinicalMinutes} minutes logged (meets 20-minute threshold)`
      : `Only ${totalClinicalMinutes} of 20 required minutes logged`,
    estimatedReimbursement: totalClinicalMinutes >= 20 ? 53 : 0,
  });

  if (totalClinicalMinutes >= 40) {
    const additionalBlocks = Math.floor((totalClinicalMinutes - 20) / 20);
    eligibleCodes.push({
      code: '99458',
      description: `RPM additional 20 min (x${additionalBlocks})`,
      eligible: true,
      reason: `${additionalBlocks} additional 20-min block(s)`,
      estimatedReimbursement: 45 * additionalBlocks,
    });
  }

  const totalEstimatedReimbursement = eligibleCodes.reduce(
    (sum, code) => sum + code.estimatedReimbursement,
    0
  );

  return {
    patientId,
    periodStart,
    periodEnd,
    totalDeviceDataDays,
    totalClinicalMinutes,
    eligibleCodes,
    totalEstimatedReimbursement,
  };
}
