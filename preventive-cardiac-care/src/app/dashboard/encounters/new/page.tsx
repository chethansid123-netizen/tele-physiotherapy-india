'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

const ENCOUNTER_TYPES = [
  'TELEHEALTH_VIDEO', 'TELEHEALTH_PHONE', 'RPM_REVIEW', 'CCM_MANAGEMENT',
  'ASYNC_DIGITAL', 'CARDIAC_TELEMETRY_REVIEW', 'PULMONARY_MONITORING',
  'POST_OP_FOLLOWUP', 'CARE_COORDINATION',
];
const MODES = ['VIDEO', 'PHONE', 'ASYNC_MESSAGE', 'RPM_DATA_REVIEW', 'IN_PERSON_HYBRID'];

export default function NewEncounterPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    patientId: '',
    providerId: '',
    encounterDate: new Date().toISOString().slice(0, 10),
    startTime: new Date().toISOString().slice(0, 16),
    durationMinutes: 15,
    encounterType: 'TELEHEALTH_VIDEO',
    communicationMode: 'VIDEO',
    chiefComplaint: '',
    assessment: '',
    plan: '',
  });

  useEffect(() => {
    fetch('/api/patients?limit=100')
      .then((r) => r.json())
      .then((d) => {
        setPatients(d.patients || []);
        if (d.patients?.[0]) setForm((f) => ({ ...f, patientId: d.patients[0].id }));
      });
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const body = {
      ...form,
      encounterDate: new Date(form.encounterDate).toISOString(),
      startTime: new Date(form.startTime).toISOString(),
      durationMinutes: Number(form.durationMinutes),
      placeOfService: '10',
    };

    if (!body.providerId) {
      setError('Provider ID required. Use the seeded physician provider ID.');
      setLoading(false);
      return;
    }

    const res = await fetch('/api/encounters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (!res.ok) {
      setError(JSON.stringify((await res.json()).error));
      return;
    }
    router.push('/dashboard/encounters');
  }

  const input = 'w-full px-4 py-2 border border-gray-300 rounded-lg';
  const label = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">New Encounter</h1>

      <form
        onSubmit={submit}
        className="bg-white rounded-xl shadow-sm border p-6 max-w-2xl space-y-4"
      >
        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}

        <div>
          <label className={label}>Patient *</label>
          <select
            className={input}
            value={form.patientId}
            onChange={(e) => setForm({ ...form, patientId: e.target.value })}
            required
          >
            <option value="">Select...</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName} ({p.mrn})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={label}>Provider ID *</label>
          <input
            className={input}
            value={form.providerId}
            onChange={(e) => setForm({ ...form, providerId: e.target.value })}
            placeholder="Paste provider ID (from seeded physician)"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Tip: login as admin, create/find the provider, paste its ID here.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Encounter Date *</label>
            <input
              type="date"
              className={input}
              required
              value={form.encounterDate}
              onChange={(e) => setForm({ ...form, encounterDate: e.target.value })}
            />
          </div>
          <div>
            <label className={label}>Start Time *</label>
            <input
              type="datetime-local"
              className={input}
              required
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            />
          </div>
          <div>
            <label className={label}>Duration (min) *</label>
            <input
              type="number"
              className={input}
              required
              value={form.durationMinutes}
              onChange={(e) =>
                setForm({ ...form, durationMinutes: parseInt(e.target.value || '0') })
              }
            />
          </div>
          <div>
            <label className={label}>Encounter Type *</label>
            <select
              className={input}
              value={form.encounterType}
              onChange={(e) => setForm({ ...form, encounterType: e.target.value })}
            >
              {ENCOUNTER_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Communication Mode *</label>
            <select
              className={input}
              value={form.communicationMode}
              onChange={(e) => setForm({ ...form, communicationMode: e.target.value })}
            >
              {MODES.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={label}>Chief Complaint</label>
          <input
            className={input}
            value={form.chiefComplaint}
            onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })}
          />
        </div>
        <div>
          <label className={label}>Assessment</label>
          <textarea
            className={input}
            rows={3}
            value={form.assessment}
            onChange={(e) => setForm({ ...form, assessment: e.target.value })}
          />
        </div>
        <div>
          <label className={label}>Plan</label>
          <textarea
            className={input}
            rows={3}
            value={form.plan}
            onChange={(e) => setForm({ ...form, plan: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Encounter'}
        </button>
      </form>
    </div>
  );
}
