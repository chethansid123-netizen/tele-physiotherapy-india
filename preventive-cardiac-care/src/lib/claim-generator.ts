import { Claim, Patient, Provider, Insurance, BillingRecord, User } from '@prisma/client';

interface CMS1500Data {
  insuranceType: string;
  insuredId: string;
  patientName: string;
  patientDob: string;
  patientSex: string;
  insuredName: string;
  patientAddress: string;
  relationship: string;
  otherInsuredName: string;
  policyGroup: string;
  signatureOnFile: boolean;
  dateOfIllness: string;
  referringProvider: string;
  referringNpi: string;
  diagnosisCodes: { pointer: string; code: string }[];
  serviceLines: {
    dateOfService: string;
    placeOfService: string;
    cptCode: string;
    modifiers: string[];
    diagnosisPointers: string[];
    charges: number;
    units: number;
    renderingNpi: string;
  }[];
  taxId: string;
  patientAccountNumber: string;
  acceptAssignment: boolean;
  totalCharges: number;
  providerSignature: string;
  providerSignatureDate: string;
  facilityName: string;
  facilityAddress: string;
  facilityNpi: string;
  billingProviderName: string;
  billingProviderAddress: string;
  billingProviderNpi: string;
  billingProviderPhone: string;
}

type ClaimWithRelations = Claim & {
  patient: Patient;
  provider: Provider & { user: User };
  insurance: Insurance;
  billingRecords: BillingRecord[];
};

export function generateCMS1500Data(claim: ClaimWithRelations): CMS1500Data {
  const patient = claim.patient;
  const provider = claim.provider;
  const insurance = claim.insurance;

  const allIcdCodes = [...new Set(claim.billingRecords.flatMap((r) => r.icdCodes))];
  const diagnosisCodes = allIcdCodes.map((code, i) => ({
    pointer: String.fromCharCode(65 + i),
    code,
  }));

  const serviceLines = claim.billingRecords.map((record) => ({
    dateOfService: record.dateOfService.toISOString().slice(0, 10),
    placeOfService: record.placeOfService,
    cptCode: record.cptCode,
    modifiers: record.modifiers,
    diagnosisPointers: record.icdCodes.map((icd) => {
      const match = diagnosisCodes.find((d) => d.code === icd);
      return match?.pointer || 'A';
    }),
    charges: Number(record.chargeAmount),
    units: record.unitsOfService,
    renderingNpi: provider.npi,
  }));

  const insuranceTypeMap: Record<string, string> = {
    MEDICARE: 'Medicare',
    MEDICAID: 'Medicaid',
    TRICARE: 'TRICARE',
    VA: 'CHAMPVA',
    COMMERCIAL: 'Group Health Plan',
    OTHER: 'Other',
  };

  return {
    insuranceType: insuranceTypeMap[insurance.payerType] || 'Other',
    insuredId: patient.insuranceMemberId || '',
    patientName: `${patient.lastName}, ${patient.firstName}`,
    patientDob: patient.dateOfBirth.toISOString().slice(0, 10),
    patientSex: patient.gender === 'Male' ? 'M' : patient.gender === 'Female' ? 'F' : 'U',
    insuredName: `${patient.lastName}, ${patient.firstName}`,
    patientAddress: [patient.address, patient.city, patient.state, patient.zipCode]
      .filter(Boolean)
      .join(', '),
    relationship: 'Self',
    otherInsuredName: '',
    policyGroup: patient.insuranceGroupNumber || '',
    signatureOnFile: true,
    dateOfIllness: patient.surgeryDate.toISOString().slice(0, 10),
    referringProvider: claim.referringProviderNpi ? 'Referring Provider' : '',
    referringNpi: claim.referringProviderNpi || '',
    diagnosisCodes,
    serviceLines,
    taxId: provider.taxId || '',
    patientAccountNumber: patient.mrn,
    acceptAssignment: true,
    totalCharges: Number(claim.totalCharges),
    providerSignature: `${provider.user.firstName} ${provider.user.lastName}, ${provider.credentials}`,
    providerSignatureDate: new Date().toISOString().slice(0, 10),
    facilityName: claim.facilityName || 'Telehealth',
    facilityAddress: 'Telehealth — Patient Home',
    facilityNpi: claim.facilityNpi || '',
    billingProviderName: `${provider.user.firstName} ${provider.user.lastName}, ${provider.credentials}`,
    billingProviderAddress: '',
    billingProviderNpi: provider.npi,
    billingProviderPhone: '',
  };
}
