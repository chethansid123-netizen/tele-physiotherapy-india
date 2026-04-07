'use client';

import { useRouter } from 'next/navigation';
import { useState, FormEvent } from 'react';

const SURGERY_TYPES = [
  'CABG', 'VALVE_REPLACEMENT', 'VALVE_REPAIR', 'STENT_PLACEMENT',
  'PACEMAKER_IMPLANT', 'ICD_IMPLANT', 'HEART_TRANSPLANT', 'LVAD_IMPLANT',
  'LOBECTOMY', 'PNEUMONECTOMY', 'WEDGE_RESECTION', 'VATS',
  'LUNG_TRANSPLANT', 'OTHER_CARDIAC', 'OTHER_LUNG',
];

export default function NewPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'Male',
    phone: '',
    email: '',
    surgeryType: 'CABG',
    surgeryDate: '',
    primaryDiagnosis: 'Z95.1',
    riskLevel: 'MODERATE',
  });

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm({ ...form, [k]: v });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const body = {
      ...form,
      dateOfBirth: new Date(form.dateOfBirth).toISOString(),
      surgeryDate: new Date(form.surgeryDate).toISOString(),
      email: form.email || undefined,
      phone: form.phone || undefined,
    };

    const res = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!res.ok) {
      const err = await res.json();
      setError(JSON.stringify(err.error));
      return;
    }
    router.push('/dashboard/patients');
  }

  const input = 'w-full px-4 py-2 border border-gray-300 rounded-lg';
  const label = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">New Patient</h1>

      <form
        onSubmit={submit}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl space-y-4"
      >
        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>First Name *</label>
            <input
              className={input}
              required
              value={form.firstName}
              onChange={(e) => set('firstName', e.target.value)}
            />
          </div>
          <div>
            <label className={label}>Last Name *</label>
            <input
              className={input}
              required
              value={form.lastName}
              onChange={(e) => set('lastName', e.target.value)}
            />
          </div>
          <div>
            <label className={label}>Date of Birth *</label>
            <input
              type="date"
              className={input}
              required
              value={form.dateOfBirth}
              onChange={(e) => set('dateOfBirth', e.target.value)}
            />
          </div>
          <div>
            <label className={label}>Gender *</label>
            <select
              className={input}
              value={form.gender}
              onChange={(e) => set('gender', e.target.value)}
            >
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
              <option>Prefer not to say</option>
            </select>
          </div>
          <div>
            <label className={label}>Phone</label>
            <input
              className={input}
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
            />
          </div>
          <div>
            <label className={label}>Email</label>
            <input
              type="email"
              className={input}
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
          </div>
          <div>
            <label className={label}>Surgery Type *</label>
            <select
              className={input}
              value={form.surgeryType}
              onChange={(e) => set('surgeryType', e.target.value)}
            >
              {SURGERY_TYPES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Surgery Date *</label>
            <input
              type="date"
              className={input}
              required
              value={form.surgeryDate}
              onChange={(e) => set('surgeryDate', e.target.value)}
            />
          </div>
          <div>
            <label className={label}>Primary Diagnosis (ICD-10) *</label>
            <input
              className={input}
              required
              value={form.primaryDiagnosis}
              onChange={(e) => set('primaryDiagnosis', e.target.value)}
            />
          </div>
          <div>
            <label className={label}>Risk Level</label>
            <select
              className={input}
              value={form.riskLevel}
              onChange={(e) => set('riskLevel', e.target.value)}
            >
              <option>LOW</option>
              <option>MODERATE</option>
              <option>HIGH</option>
              <option>CRITICAL</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Patient'}
        </button>
      </form>
    </div>
  );
}
