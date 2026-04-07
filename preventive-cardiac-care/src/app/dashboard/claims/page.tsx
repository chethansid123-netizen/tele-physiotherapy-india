'use client';

import { useEffect, useState } from 'react';

export default function ClaimsPage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  async function load() {
    setLoading(true);
    const q = status ? `?status=${status}` : '';
    const d = await fetch(`/api/claims${q}`).then((r) => r.json());
    setClaims(d.claims || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Claims</h1>

      <div className="mb-4">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="PAID">Paid</option>
          <option value="DENIED">Denied</option>
          <option value="APPEALED">Appealed</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3">Claim #</th>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Payer</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Paid</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : claims.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  No claims.
                </td>
              </tr>
            ) : (
              claims.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-3 font-mono">{c.claimNumber}</td>
                  <td className="px-4 py-3">
                    {c.patient?.firstName} {c.patient?.lastName}
                  </td>
                  <td className="px-4 py-3">{c.insurance?.payerName}</td>
                  <td className="px-4 py-3">${Number(c.totalCharges).toFixed(2)}</td>
                  <td className="px-4 py-3">${Number(c.totalPaid || 0).toFixed(2)}</td>
                  <td className="px-4 py-3">{c.claimStatus}</td>
                  <td className="px-4 py-3">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
