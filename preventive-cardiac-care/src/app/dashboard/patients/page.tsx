'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`/api/patients${q}`).then((r) => r.json());
    setPatients(res.patients || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Patients</h1>
        <Link
          href="/dashboard/patients/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          + New Patient
        </Link>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          placeholder="Search by name or MRN..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
        />
        <button
          onClick={load}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm"
        >
          Search
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3">MRN</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Surgery</th>
              <th className="px-4 py-3">Surgery Date</th>
              <th className="px-4 py-3">Risk</th>
              <th className="px-4 py-3">Encounters</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No patients found.
                </td>
              </tr>
            ) : (
              patients.map((p) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono">{p.mrn}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/patients/${p.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {p.firstName} {p.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{p.surgeryType}</td>
                  <td className="px-4 py-3">
                    {new Date(p.surgeryDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">{p.riskLevel}</td>
                  <td className="px-4 py-3">{p._count?.encounters ?? 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
