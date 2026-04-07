'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/patients/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        setPatient(d);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (!patient?.id) return <div className="text-red-600">Patient not found</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {patient.firstName} {patient.lastName}
        </h1>
        <p className="text-sm text-gray-500">
          MRN: {patient.mrn} · {patient.surgeryType} ·{' '}
          {new Date(patient.surgeryDate).toLocaleDateString()}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-semibold mb-2">Demographics</h2>
          <p className="text-sm">DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}</p>
          <p className="text-sm">Gender: {patient.gender}</p>
          <p className="text-sm">Phone: {patient.phone || '—'}</p>
          <p className="text-sm">Email: {patient.email || '—'}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-semibold mb-2">Clinical</h2>
          <p className="text-sm">Primary Dx: {patient.primaryDiagnosis}</p>
          <p className="text-sm">Risk: {patient.riskLevel}</p>
          <p className="text-sm">Telehealth Consent: {patient.teleHealthConsent ? 'Yes' : 'No'}</p>
          <p className="text-sm">RPM Consent: {patient.rpmConsent ? 'Yes' : 'No'}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h2 className="font-semibold mb-3">Recent Encounters</h2>
        {patient.encounters?.length === 0 ? (
          <p className="text-sm text-gray-500">No encounters yet.</p>
        ) : (
          <ul className="text-sm space-y-1">
            {patient.encounters?.map((e: any) => (
              <li key={e.id}>
                {new Date(e.encounterDate).toLocaleDateString()} — {e.encounterType} (
                {e.durationMinutes || 0} min)
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h2 className="font-semibold mb-3">Billing Records</h2>
        {patient.billingRecords?.length === 0 ? (
          <p className="text-sm text-gray-500">No billing records yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-gray-600">
              <tr>
                <th>Date</th>
                <th>CPT</th>
                <th>Charge</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {patient.billingRecords?.map((b: any) => (
                <tr key={b.id} className="border-t">
                  <td>{new Date(b.dateOfService).toLocaleDateString()}</td>
                  <td>{b.cptCode}</td>
                  <td>${Number(b.chargeAmount).toFixed(2)}</td>
                  <td>{b.billingStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
