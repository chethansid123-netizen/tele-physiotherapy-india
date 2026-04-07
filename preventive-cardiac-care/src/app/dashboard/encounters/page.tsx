'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function EncountersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/encounters')
      .then((r) => r.json())
      .then((d) => {
        setItems(d.encounters || []);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Encounters</h1>
        <Link
          href="/dashboard/encounters/new"
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
        >
          + New Encounter
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Mode</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No encounters yet.
                </td>
              </tr>
            ) : (
              items.map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="px-4 py-3">
                    {new Date(e.encounterDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {e.patient?.firstName} {e.patient?.lastName}
                  </td>
                  <td className="px-4 py-3">{e.encounterType}</td>
                  <td className="px-4 py-3">{e.communicationMode}</td>
                  <td className="px-4 py-3">{e.durationMinutes || 0} min</td>
                  <td className="px-4 py-3">{e.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
