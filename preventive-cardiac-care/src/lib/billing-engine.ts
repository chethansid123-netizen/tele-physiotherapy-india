import { EncounterType, CommunicationMode, SurgeryType } from '@prisma/client';

interface EncounterContext {
  encounterType: EncounterType;
  communicationMode: CommunicationMode;
  durationMinutes: number;
  surgeryType: SurgeryType;
  daysSinceSurgery: number;
  hasRpmData: boolean;
  rpmDaysInPeriod: number;
  rpmMinutesInPeriod: number;
  chronicConditionCount: number;
  ccmMinutesInMonth: number;
  isInGlobalPeriod: boolean;
}

interface CptSuggestion {
  cptCode: string;
  description: string;
  modifier: string[];
  chargeAmount: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
  warnings: string[];
}

export function suggestCptCodes(context: EncounterContext): CptSuggestion[] {
  const suggestions: CptSuggestion[] = [];
  const warnings: string[] = [];

  if (context.isInGlobalPeriod && context.daysSinceSurgery <= 90) {
    warnings.push(
      'Patient is within the 90-day global surgical period. ' +
      'Post-op follow-up visits (99024) are bundled and not separately billable. ' +
      'Only separately identifiable services with modifier -24 can be billed.'
    );
  }

  if (context.encounterType === 'TELEHEALTH_VIDEO') {
    const modifier = ['-95'];
    if (context.durationMinutes >= 5 && context.durationMinutes <= 10) {
      suggestions.push({
        cptCode: '99421',
        description: 'Online digital E/M, 5-10 min',
        modifier,
        chargeAmount: 17,
        confidence: 'MEDIUM',
        reason: 'Short telehealth video encounter',
        warnings,
      });
    }
  }

  if (context.encounterType === 'TELEHEALTH_PHONE' ||
      context.communicationMode === 'PHONE') {
    if (context.durationMinutes >= 5 && context.durationMinutes <= 10) {
      suggestions.push({
        cptCode: '99441',
        description: 'Telephone E/M, 5-10 minutes',
        modifier: ['-FQ'],
        chargeAmount: 15,
        confidence: 'HIGH',
        reason: `Phone encounter duration: ${context.durationMinutes} min`,
        warnings,
      });
    } else if (context.durationMinutes >= 11 && context.durationMinutes <= 20) {
      suggestions.push({
        cptCode: '99442',
        description: 'Telephone E/M, 11-20 minutes',
        modifier: ['-FQ'],
        chargeAmount: 30,
        confidence: 'HIGH',
        reason: `Phone encounter duration: ${context.durationMinutes} min`,
        warnings,
      });
    } else if (context.durationMinutes >= 21) {
      suggestions.push({
        cptCode: '99443',
        description: 'Telephone E/M, 21-30 minutes',
        modifier: ['-FQ'],
        chargeAmount: 44,
        confidence: 'HIGH',
        reason: `Phone encounter duration: ${context.durationMinutes} min`,
        warnings,
      });
    }
  }

  if (context.encounterType === 'RPM_REVIEW' || context.hasRpmData) {
    if (context.rpmDaysInPeriod >= 16) {
      suggestions.push({
        cptCode: '99454',
        description: 'RPM device supply with daily recordings, 30-day period',
        modifier: [],
        chargeAmount: 60,
        confidence: 'HIGH',
        reason: `Patient has ${context.rpmDaysInPeriod} days of RPM data (>=16 required)`,
        warnings: [],
      });
    } else if (context.rpmDaysInPeriod > 0 && context.rpmDaysInPeriod < 16) {
      suggestions.push({
        cptCode: '99454',
        description: 'RPM device supply with daily recordings, 30-day period',
        modifier: [],
        chargeAmount: 60,
        confidence: 'LOW',
        reason: `Patient has only ${context.rpmDaysInPeriod} days — need >=16 days`,
        warnings: [`Only ${context.rpmDaysInPeriod}/16 required days of data recorded`],
      });
    }

    if (context.rpmMinutesInPeriod >= 20) {
      suggestions.push({
        cptCode: '99457',
        description: 'RPM treatment management, first 20 min/month',
        modifier: [],
        chargeAmount: 53,
        confidence: 'HIGH',
        reason: `${context.rpmMinutesInPeriod} min RPM time logged (>=20 required)`,
        warnings: [],
      });

      const additionalBlocks = Math.floor((context.rpmMinutesInPeriod - 20) / 20);
      if (additionalBlocks > 0) {
        suggestions.push({
          cptCode: '99458',
          description: `RPM treatment management, additional 20 min (x${additionalBlocks})`,
          modifier: [],
          chargeAmount: 45 * additionalBlocks,
          confidence: 'HIGH',
          reason: `${additionalBlocks} additional 20-min block(s) of RPM time`,
          warnings: [],
        });
      }
    }
  }

  if (context.encounterType === 'CCM_MANAGEMENT' &&
      context.chronicConditionCount >= 2) {
    if (context.ccmMinutesInMonth >= 20) {
      suggestions.push({
        cptCode: '99490',
        description: 'Chronic Care Management, first 20 min/month',
        modifier: [],
        chargeAmount: 45,
        confidence: 'HIGH',
        reason: `Patient has ${context.chronicConditionCount} chronic conditions, ${context.ccmMinutesInMonth} min CCM time`,
        warnings: [],
      });

      const additionalCcm = Math.floor((context.ccmMinutesInMonth - 20) / 20);
      if (additionalCcm > 0) {
        suggestions.push({
          cptCode: '99439',
          description: `CCM, each additional 20 min (x${additionalCcm})`,
          modifier: [],
          chargeAmount: 39 * additionalCcm,
          confidence: 'HIGH',
          reason: `${additionalCcm} additional 20-min CCM block(s)`,
          warnings: [],
        });
      }
    }
  }

  if (context.encounterType === 'CARDIAC_TELEMETRY_REVIEW') {
    const isCardiacSurgery = [
      'CABG', 'VALVE_REPLACEMENT', 'VALVE_REPAIR', 'STENT_PLACEMENT',
      'PACEMAKER_IMPLANT', 'ICD_IMPLANT', 'HEART_TRANSPLANT', 'LVAD_IMPLANT',
    ].includes(context.surgeryType);

    if (isCardiacSurgery) {
      suggestions.push({
        cptCode: '93297',
        description: 'Remote cardiac telemetry — physician review & interpretation',
        modifier: [],
        chargeAmount: 44,
        confidence: 'HIGH',
        reason: 'Cardiac telemetry data review for post-cardiac surgery patient',
        warnings: [],
      });
    }
  }

  if (context.encounterType === 'PULMONARY_MONITORING') {
    const isLungSurgery = [
      'LOBECTOMY', 'PNEUMONECTOMY', 'WEDGE_RESECTION', 'VATS', 'LUNG_TRANSPLANT',
    ].includes(context.surgeryType);

    if (isLungSurgery) {
      suggestions.push({
        cptCode: '94014',
        description: 'Patient-initiated spirometry recording',
        modifier: [],
        chargeAmount: 12,
        confidence: 'HIGH',
        reason: 'Pulmonary function monitoring for post-lung surgery patient',
        warnings: [],
      });
    }
  }

  if (context.encounterType === 'ASYNC_DIGITAL' ||
      context.communicationMode === 'ASYNC_MESSAGE') {
    if (context.durationMinutes >= 5 && context.durationMinutes <= 10) {
      suggestions.push({
        cptCode: '99421',
        description: 'Online digital E/M, 5-10 min cumulative',
        modifier: ['-GQ'],
        chargeAmount: 17,
        confidence: 'HIGH',
        reason: `Async digital encounter: ${context.durationMinutes} min`,
        warnings: [],
      });
    } else if (context.durationMinutes >= 11 && context.durationMinutes <= 20) {
      suggestions.push({
        cptCode: '99422',
        description: 'Online digital E/M, 11-20 min cumulative',
        modifier: ['-GQ'],
        chargeAmount: 32,
        confidence: 'HIGH',
        reason: `Async digital encounter: ${context.durationMinutes} min`,
        warnings: [],
      });
    } else if (context.durationMinutes >= 21) {
      suggestions.push({
        cptCode: '99423',
        description: 'Online digital E/M, 21+ min cumulative',
        modifier: ['-GQ'],
        chargeAmount: 53,
        confidence: 'HIGH',
        reason: `Async digital encounter: ${context.durationMinutes} min`,
        warnings: [],
      });
    }
  }

  return suggestions;
}
