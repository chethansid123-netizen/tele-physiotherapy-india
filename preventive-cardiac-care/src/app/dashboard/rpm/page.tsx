'use client';

export default function RpmPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Remote Patient Monitoring</h1>
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <p className="text-sm text-gray-600">
          RPM device data and clinician time tracking. Post to <code>/api/rpm</code> for device
          readings and <code>/api/rpm/time-tracking</code> for clinical time logs. Billing
          calculator auto-computes 99454/99457/99458 eligibility based on 30-day thresholds
          (16+ days of data, 20+/40+ minutes of clinical time).
        </p>
      </div>
    </div>
  );
}
