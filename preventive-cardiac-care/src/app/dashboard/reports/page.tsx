'use client';

import { useEffect, useState } from 'react';

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/revenue')
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-gray-500">Loading reports...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Revenue Reports</h1>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-500">Total Charged</p>
          <p className="text-2xl font-bold">${(data?.totals?.totalCharged || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-500">Total Paid</p>
          <p className="text-2xl font-bold">${(data?.totals?.totalPaid || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-500">Collection Rate</p>
          <p className="text-2xl font-bold">{data?.totals?.collectionRate || 0}%</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-500">Records</p>
          <p className="text-2xl font-bold">{data?.totals?.totalRecords || 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="font-semibold mb-4">Revenue by CPT Code</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-gray-600">
            <tr>
              <th className="py-2">CPT</th>
              <th className="py-2">Count</th>
              <th className="py-2">Charged</th>
              <th className="py-2">Paid</th>
            </tr>
          </thead>
          <tbody>
            {(data?.revenueByCpt || []).length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-gray-500">
                  No data yet.
                </td>
              </tr>
            ) : (
              data.revenueByCpt.map((r: any) => (
                <tr key={r.cptCode} className="border-t">
                  <td className="py-2 font-mono">{r.cptCode}</td>
                  <td className="py-2">{r._count}</td>
                  <td className="py-2">${Number(r._sum?.chargeAmount || 0).toFixed(2)}</td>
                  <td className="py-2">${Number(r._sum?.paidAmount || 0).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="font-semibold mb-4">Claim Status Summary</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-gray-600">
            <tr>
              <th className="py-2">Status</th>
              <th className="py-2">Count</th>
              <th className="py-2">Total Charges</th>
              <th className="py-2">Total Paid</th>
            </tr>
          </thead>
          <tbody>
            {(data?.claimSummary || []).length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-gray-500">
                  No claims yet.
                </td>
              </tr>
            ) : (
              data.claimSummary.map((c: any) => (
                <tr key={c.claimStatus} className="border-t">
                  <td className="py-2">{c.claimStatus}</td>
                  <td className="py-2">{c._count}</td>
                  <td className="py-2">${Number(c._sum?.totalCharges || 0).toFixed(2)}</td>
                  <td className="py-2">${Number(c._sum?.totalPaid || 0).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
