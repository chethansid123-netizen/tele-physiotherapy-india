import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const cptCodes = [
    { code: '99453', description: 'RPM — Initial setup & patient education', category: 'RPM', baseRate: 20, timeRequired: null, requiresModifier: false, applicableModifiers: [], documentationReqs: ['Patient consent', 'Device type', 'Education provided'] },
    { code: '99454', description: 'RPM — Device supply with daily recordings (30 days)', category: 'RPM', baseRate: 60, timeRequired: null, requiresModifier: false, applicableModifiers: [], documentationReqs: ['16+ days data', 'Device type', 'Transmission dates'] },
    { code: '99457', description: 'RPM — Treatment management, first 20 min/month', category: 'RPM', baseRate: 53, timeRequired: 20, requiresModifier: false, applicableModifiers: [], documentationReqs: ['Time log', 'Clinical review notes', 'Interactive communication'] },
    { code: '99458', description: 'RPM — Treatment management, each addtl 20 min', category: 'RPM', baseRate: 45, timeRequired: 20, requiresModifier: false, applicableModifiers: [], documentationReqs: ['Time log', 'Activities performed'] },
    { code: '99490', description: 'CCM — Chronic Care Management, first 20 min/month', category: 'CCM', baseRate: 45, timeRequired: 20, requiresModifier: false, applicableModifiers: [], documentationReqs: ['2+ chronic conditions', 'Care plan', 'Time log'] },
    { code: '99491', description: 'CCM — Complex, first 30 min by physician/QHP', category: 'CCM', baseRate: 87, timeRequired: 30, requiresModifier: false, applicableModifiers: [], documentationReqs: ['2+ chronic conditions', 'Physician time', 'Care plan'] },
    { code: '99439', description: 'CCM — Each additional 20 min', category: 'CCM', baseRate: 39, timeRequired: 20, requiresModifier: false, applicableModifiers: [], documentationReqs: ['Time log'] },
    { code: '99441', description: 'Telephone E/M — 5-10 min', category: 'TELEPHONE_EM', baseRate: 15, timeRequired: 5, requiresModifier: true, applicableModifiers: ['-FQ'], documentationReqs: ['Duration', 'Medical discussion notes'] },
    { code: '99442', description: 'Telephone E/M — 11-20 min', category: 'TELEPHONE_EM', baseRate: 30, timeRequired: 11, requiresModifier: true, applicableModifiers: ['-FQ'], documentationReqs: ['Duration', 'Medical discussion notes'] },
    { code: '99443', description: 'Telephone E/M — 21-30 min', category: 'TELEPHONE_EM', baseRate: 44, timeRequired: 21, requiresModifier: true, applicableModifiers: ['-FQ'], documentationReqs: ['Duration', 'Medical discussion notes'] },
    { code: '99421', description: 'Online digital E/M — 5-10 min cumulative', category: 'ONLINE_DIGITAL', baseRate: 17, timeRequired: 5, requiresModifier: true, applicableModifiers: ['-GQ', '-95'], documentationReqs: ['Cumulative time', 'Platform used'] },
    { code: '99422', description: 'Online digital E/M — 11-20 min cumulative', category: 'ONLINE_DIGITAL', baseRate: 32, timeRequired: 11, requiresModifier: true, applicableModifiers: ['-GQ', '-95'], documentationReqs: ['Cumulative time', 'Platform used'] },
    { code: '99423', description: 'Online digital E/M — 21+ min cumulative', category: 'ONLINE_DIGITAL', baseRate: 53, timeRequired: 21, requiresModifier: true, applicableModifiers: ['-GQ', '-95'], documentationReqs: ['Cumulative time', 'Platform used'] },
    { code: '93297', description: 'Remote cardiac telemetry — physician review', category: 'CARDIAC_MONITORING', baseRate: 44, timeRequired: null, requiresModifier: false, applicableModifiers: [], documentationReqs: ['Device data', 'Interpretation report'] },
    { code: '93298', description: 'Remote cardiac telemetry — tech review', category: 'CARDIAC_MONITORING', baseRate: 22, timeRequired: null, requiresModifier: false, applicableModifiers: [], documentationReqs: ['Scanning report', 'Alert summary'] },
    { code: '93264', description: 'Remote hemodynamic monitoring (CardioMEMS), 30 days', category: 'CARDIAC_MONITORING', baseRate: 123, timeRequired: null, requiresModifier: false, applicableModifiers: [], documentationReqs: ['PA pressure data', '30-day period'] },
    { code: '93228', description: 'Mobile cardiac telemetry (MCT) with analysis, up to 30 days', category: 'CARDIAC_MONITORING', baseRate: 155, timeRequired: null, requiresModifier: false, applicableModifiers: [], documentationReqs: ['30-day MCT report', 'Event analysis'] },
    { code: '93268', description: 'External patient-activated ECG, up to 30 days', category: 'CARDIAC_MONITORING', baseRate: 63, timeRequired: null, requiresModifier: false, applicableModifiers: [], documentationReqs: ['Event recordings', 'Patient diary'] },
    { code: '94014', description: 'Patient-initiated spirometry recording', category: 'PULMONARY_MONITORING', baseRate: 12, timeRequired: null, requiresModifier: false, applicableModifiers: [], documentationReqs: ['Spirometry data', 'Interpretation'] },
  ];

  for (const cpt of cptCodes) {
    await prisma.cptCode.upsert({
      where: { code: cpt.code },
      update: cpt as any,
      create: cpt as any,
    });
  }

  const icdCodes = [
    { code: 'Z95.0', description: 'Presence of cardiac pacemaker', category: 'Post-Cardiac' },
    { code: 'Z95.1', description: 'Presence of aortocoronary bypass graft', category: 'Post-Cardiac' },
    { code: 'Z95.2', description: 'Presence of prosthetic heart valve', category: 'Post-Cardiac' },
    { code: 'Z95.5', description: 'Presence of coronary angioplasty implant/graft', category: 'Post-Cardiac' },
    { code: 'Z95.810', description: 'Presence of heart assist device', category: 'Post-Cardiac' },
    { code: 'Z95.811', description: 'Presence of heart transplant', category: 'Post-Cardiac' },
    { code: 'I25.10', description: 'Atherosclerotic heart disease of native coronary artery', category: 'Cardiac' },
    { code: 'I25.810', description: 'Atherosclerosis of coronary artery bypass graft', category: 'Post-Cardiac' },
    { code: 'I50.9', description: 'Heart failure, unspecified', category: 'Cardiac' },
    { code: 'I48.91', description: 'Unspecified atrial fibrillation', category: 'Cardiac' },
    { code: 'I97.0', description: 'Postcardiotomy syndrome', category: 'Post-Cardiac Complication' },
    { code: 'I97.110', description: 'Postprocedural cardiac insufficiency following cardiac surgery', category: 'Post-Cardiac Complication' },
    { code: 'J95.89', description: 'Other postprocedural complications of respiratory system', category: 'Post-Lung' },
    { code: 'Z87.891', description: 'Personal history of lung surgery', category: 'Post-Lung' },
    { code: 'Z96.29', description: 'Presence of other vascular implants and grafts', category: 'Post-Cardiac' },
    { code: 'J96.10', description: 'Chronic respiratory failure, unspecified', category: 'Pulmonary' },
    { code: 'J43.9', description: 'Emphysema, unspecified', category: 'Pulmonary' },
    { code: 'Z48.812', description: 'Encounter for surgical aftercare following surgery on the respiratory system', category: 'Post-Lung' },
    { code: 'Z48.811', description: 'Encounter for surgical aftercare following surgery on the circulatory system', category: 'Post-Cardiac' },
  ];

  for (const icd of icdCodes) {
    await prisma.icdCode.upsert({
      where: { code: icd.code },
      update: icd,
      create: icd,
    });
  }

  const hashedPassword = await bcrypt.hash('admin123', 12);

  await prisma.user.upsert({
    where: { email: 'admin@cardiaccare.com' },
    update: {},
    create: {
      email: 'admin@cardiaccare.com',
      passwordHash: hashedPassword,
      firstName: 'System',
      lastName: 'Admin',
      role: 'ADMIN',
    },
  });

  const physicianUser = await prisma.user.upsert({
    where: { email: 'dr.smith@cardiaccare.com' },
    update: {},
    create: {
      email: 'dr.smith@cardiaccare.com',
      passwordHash: hashedPassword,
      firstName: 'John',
      lastName: 'Smith',
      role: 'PHYSICIAN',
    },
  });

  await prisma.provider.upsert({
    where: { userId: physicianUser.id },
    update: {},
    create: {
      userId: physicianUser.id,
      npi: '1234567890',
      credentials: 'MD',
      specialty: 'Cardiothoracic Surgery',
      taxonomyCode: '208G00000X',
      licenseState: 'CA',
    },
  });

  await prisma.user.upsert({
    where: { email: 'billing@cardiaccare.com' },
    update: {},
    create: {
      email: 'billing@cardiaccare.com',
      passwordHash: hashedPassword,
      firstName: 'Jane',
      lastName: 'Doe',
      role: 'BILLING_SPECIALIST',
    },
  });

  await prisma.insurance.upsert({
    where: { id: 'medicare-default' },
    update: {},
    create: {
      id: 'medicare-default',
      payerName: 'Medicare Part B',
      payerId: '00112',
      payerType: 'MEDICARE',
      planName: 'Medicare Fee-for-Service',
      planType: 'Medicare',
    },
  });

  console.log('Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
