'use client';

import { useEffect, useState } from 'react';

interface DashboardStats {
  totalPatients: number;
  activeEncounters: number;
  unbilledRecords: number;
  pendingClaims: number;
  monthlyRevenue: number;
  collectionRate: string;
  denialRate: string;
  rpmPatientsActive: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setStats({
          totalPatients: 0,
          activeEncounters: 0,
          unbilledRecords: 0,
          pendingClaims: 0,
          monthlyRevenue: 0,
          collectionRate: '0',
          denialRate: '0',
          rpmPatientsActive: 0,
        });
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-gray-500">Loading dashboard...</div>;
  }

  const cards = [
    { label: 'Total Patients', value: stats?.totalPatients || 0, color: 'bg-blue-500' },
    { label: 'Active RPM Patients', value: stats?.rpmPatientsActive || 0, color: 'bg-red-500' },
    { label: 'Unbilled Records', value: stats?.unbilledRecords || 0, color: 'bg-yellow-500' },
    { label: 'Pending Claims', value: stats?.pendingClaims || 0, color: 'bg-purple-500' },
    { label: 'Monthly Revenue', value: `$${(stats?.monthlyRevenue || 0).toLocaleString()}`, color: 'bg-green-500' },
    { label: 'Collection Rate', value: `${stats?.collectionRate || 0}%`, color: 'bg-teal-500' },
    { label: 'Denial Rate', value: `${stats?.denialRate || 0}%`, color: 'bg-orange-500' },
    { label: 'Encounters This Month', value: stats?.activeEncounters || 0, color: 'bg-indigo-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Post Cardiac & Lung Surgery — Billing Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`w-3 h-3 rounded-full ${card.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <a href="/dashboard/patients/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">+ New Patient</a>
          <a href="/dashboard/encounters/new" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">+ New Encounter</a>
          <a href="/dashboard/billing?status=UNBILLED" className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700">Review Unbilled</a>
          <a href="/dashboard/claims?status=DENIED" className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">View Denials</a>
        </div>
      </div>
    </div>
  );
}
