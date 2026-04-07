'use client';

import { useEffect, useState } from 'react';

export default function BillingPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  async function load() {
    setLoading(true);
    const q = status ? `?status=${status}` : '';
    const d = await fetch(`/api/billing${q}`).then((r) => r.json());
    setRecords(d.records || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Billing Records</h1>

      <div className="mb-4">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">All statuses</option>
          <option value="UNBILLED">Unbilled</option>
          <option value="READY_TO_BILL">Ready to Bill</option>
          <option value="BILLED">Billed</option>
          <option value="PAID">Paid</option>
          <option value="DENIED">Denied</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">CPT</th>
              <th className="px-4 py-3">Modifiers</th>
              <th className="px-4 py-3">Charge</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Claim</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  No billing records.
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3">
                    {new Date(r.dateOfService).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {r.patient?.firstName} {r.patient?.lastName}
                  </td>
                  <td className="px-4 py-3 font-mono">{r.cptCode}</td>
                  <td className="px-4 py-3">{(r.modifiers || []).join(', ')}</td>
                  <td className="px-4 py-3">${Number(r.chargeAmount).toFixed(2)}</td>
                  <td className="px-4 py-3">{r.billingStatus}</td>
                  <td className="px-4 py-3">{r.claim?.claimNumber || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
