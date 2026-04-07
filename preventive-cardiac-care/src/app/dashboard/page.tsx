'use client';

import { useEffect, useState } from 'react';

interface DashboardStats {
  totalPatients: number;
  activeEncounters: number;
  unbilledRecords: number;
  pendingClaims: number;
  totalPaid: number;
  collectionRate: string;
  denialRate: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const monthStart = new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1
        ).toISOString();
        const [patients, unbilled, pending, denied, encounters, revenue] = await Promise.all([
          fetch('/api/patients?limit=1').then((r) => r.json()),
          fetch('/api/billing?status=READY_TO_BILL&limit=1').then((r) => r.json()),
          fetch('/api/claims?status=SUBMITTED&limit=1').then((r) => r.json()),
          fetch('/api/claims?status=DENIED&limit=1').then((r) => r.json()),
          fetch(`/api/encounters?startDate=${monthStart}&limit=1`).then((r) => r.json()),
          fetch('/api/reports/revenue').then((r) => r.json()),
        ]);

        const totalClaims =
          (revenue.claimSummary || []).reduce(
            (s: number, c: any) => s + (c._count || 0),
            0
          ) || 1;
        const denialRate = (((denied.pagination?.total || 0) / totalClaims) * 100).toFixed(1);

        setStats({
          totalPatients: patients.pagination?.total || 0,
          activeEncounters: encounters.pagination?.total || 0,
          unbilledRecords: unbilled.pagination?.total || 0,
          pendingClaims: pending.pagination?.total || 0,
          totalPaid: revenue.totals?.totalPaid || 0,
          collectionRate: revenue.totals?.collectionRate || '0',
          denialRate,
        });
      } catch (e) {
        console.error(e);
        setError('Failed to load dashboard data. Is the database connected?');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-500">Loading dashboard...</div>;

  const cards = [
    { label: 'Total Patients', value: stats?.totalPatients ?? 0, color: 'bg-blue-500' },
    {
      label: 'Encounters This Month',
      value: stats?.activeEncounters ?? 0,
      color: 'bg-indigo-500',
    },
    { label: 'Unbilled Records', value: stats?.unbilledRecords ?? 0, color: 'bg-yellow-500' },
    { label: 'Pending Claims', value: stats?.pendingClaims ?? 0, color: 'bg-purple-500' },
    {
      label: 'Total Paid (YTD)',
      value: `$${(stats?.totalPaid ?? 0).toLocaleString()}`,
      color: 'bg-green-500',
    },
    { label: 'Collection Rate', value: `${stats?.collectionRate ?? 0}%`, color: 'bg-teal-500' },
    { label: 'Denial Rate', value: `${stats?.denialRate ?? 0}%`, color: 'bg-orange-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Preventive Cardiac Care — Billing Dashboard
      </h1>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{c.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{c.value}</p>
              </div>
              <div className={`w-3 h-3 rounded-full ${c.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <a
            href="/dashboard/patients/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            + New Patient
          </a>
          <a
            href="/dashboard/encounters/new"
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
          >
            + New Encounter
          </a>
          <a
            href="/dashboard/billing?status=READY_TO_BILL"
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700"
          >
            Review Unbilled
          </a>
          <a
            href="/dashboard/claims?status=DENIED"
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
          >
            View Denials
          </a>
        </div>
      </div>
    </div>
  );
}
