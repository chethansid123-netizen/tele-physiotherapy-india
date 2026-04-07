'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ReactNode } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/patients', label: 'Patients' },
  { href: '/dashboard/encounters', label: 'Encounters' },
  { href: '/dashboard/billing', label: 'Billing' },
  { href: '/dashboard/claims', label: 'Claims' },
  { href: '/dashboard/rpm', label: 'RPM' },
  { href: '/dashboard/reports', label: 'Reports' },
  { href: '/dashboard/providers', label: 'Providers' },
  { href: '/dashboard/audit', label: 'Audit Log' },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-lg font-bold">CardiacCare</h1>
          <p className="text-xs text-slate-400 mt-1">Telehealth Billing</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="text-sm text-slate-300">{session?.user?.name}</div>
          <div className="text-xs text-slate-500">{(session?.user as any)?.role}</div>
          <button
            onClick={() => signOut()}
            className="mt-2 text-xs text-red-400 hover:text-red-300"
          >
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
