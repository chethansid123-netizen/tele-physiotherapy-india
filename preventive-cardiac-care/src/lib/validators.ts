import { z } from 'zod';

export const patientSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.string().datetime(),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().max(2).optional(),
  zipCode: z.string().max(10).optional(),
  surgeryType: z.enum([
    'CABG', 'VALVE_REPLACEMENT', 'VALVE_REPAIR', 'STENT_PLACEMENT',
    'PACEMAKER_IMPLANT', 'ICD_IMPLANT', 'HEART_TRANSPLANT', 'LVAD_IMPLANT',
    'LOBECTOMY', 'PNEUMONECTOMY', 'WEDGE_RESECTION', 'VATS',
    'LUNG_TRANSPLANT', 'OTHER_CARDIAC', 'OTHER_LUNG',
  ]),
  surgeryDate: z.string().datetime(),
  surgeryDetails: z.string().optional(),
  primaryDiagnosis: z.string().min(3),
  secondaryDiagnoses: z.array(z.string()).optional(),
  riskLevel: z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']).optional(),
  primaryInsuranceId: z.string().optional(),
  secondaryInsuranceId: z.string().optional(),
  insuranceMemberId: z.string().optional(),
  insuranceGroupNumber: z.string().optional(),
});

export const encounterSchema = z.object({
  patientId: z.string(),
  providerId: z.string(),
  encounterDate: z.string().datetime(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  durationMinutes: z.number().int().positive().optional(),
  encounterType: z.enum([
    'TELEHEALTH_VIDEO', 'TELEHEALTH_PHONE', 'RPM_REVIEW',
    'CCM_MANAGEMENT', 'ASYNC_DIGITAL', 'CARDIAC_TELEMETRY_REVIEW',
    'PULMONARY_MONITORING', 'POST_OP_FOLLOWUP', 'CARE_COORDINATION',
  ]),
  communicationMode: z.enum([
    'VIDEO', 'PHONE', 'ASYNC_MESSAGE', 'RPM_DATA_REVIEW', 'IN_PERSON_HYBRID',
  ]),
  placeOfService: z.string().default('10'),
  chiefComplaint: z.string().optional(),
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  vitalSigns: z.any().optional(),
});

export const billingSchema = z.object({
  encounterId: z.string(),
  cptCode: z.string(),
  modifiers: z.array(z.string()).optional(),
  icdCodes: z.array(z.string()).min(1),
  chargeAmount: z.number().positive(),
  unitsOfService: z.number().int().positive().default(1),
});

export const rpmDeviceDataSchema = z.object({
  patientId: z.string(),
  deviceType: z.enum([
    'BLOOD_PRESSURE', 'PULSE_OXIMETER', 'WEIGHT_SCALE', 'ECG_MONITOR',
    'CARDIAC_TELEMETRY', 'SPIROMETER', 'GLUCOSE_MONITOR', 'THERMOMETER',
    'ACTIVITY_TRACKER',
  ]),
  readingDate: z.string().datetime(),
  readingValue: z.any(),
  isAbnormal: z.boolean().optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
});

export const rpmTimeLogSchema = z.object({
  patientId: z.string(),
  providerId: z.string(),
  logDate: z.string().datetime(),
  durationMinutes: z.number().int().positive(),
  activityType: z.enum([
    'DATA_REVIEW', 'PATIENT_COMMUNICATION', 'CARE_PLAN_UPDATE',
    'ALERT_RESPONSE', 'DOCUMENTATION', 'CARE_COORDINATION',
  ]),
  notes: z.string().optional(),
  billingPeriodStart: z.string().datetime(),
  billingPeriodEnd: z.string().datetime(),
});

export const claimSchema = z.object({
  patientId: z.string(),
  providerId: z.string(),
  insuranceId: z.string(),
  billingRecordIds: z.array(z.string()).min(1),
  referringProviderNpi: z.string().optional(),
  facilityName: z.string().optional(),
  facilityNpi: z.string().optional(),
});
