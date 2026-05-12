'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getUser } from '../../lib/api';
import Navbar from '../../components/Navbar';
import StatusBadge from '../../components/StatusBadge';

const PIPELINE_GROUPS = [
  { label: 'New Applications', statuses: ['applied'], color: 'bg-blue-50 border-blue-200' },
  { label: 'Screening', statuses: ['shortlisted', 'interview_scheduled', 'interview_done'], color: 'bg-violet-50 border-violet-200' },
  { label: 'Offer Stage', statuses: ['selected', 'offer_sent', 'offer_accepted', 'offer_declined'], color: 'bg-purple-50 border-purple-200' },
  { label: 'Onboarding', statuses: ['pre_boarding', 'trial', 'probation_extended'], color: 'bg-amber-50 border-amber-200' },
  { label: 'Document Stage', statuses: ['docs_pending', 'docs_submitted', 'docs_verified'], color: 'bg-yellow-50 border-yellow-200' },
  { label: 'Confirmed', statuses: ['confirmed', 'active'], color: 'bg-green-50 border-green-200' },
  { label: 'Exits', statuses: ['resigned', 'terminated', 'trial_terminated', 'offboarded'], color: 'bg-red-50 border-red-200' },
];

export default function DashboardPage() {
  const router = useRouter();
  const user = getUser();
  const [candidates, setCandidates] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push('/login'); return; }
    
    Promise.all([api.candidates.list(), api.candidates.stats()])
      .then(([c, s]) => { setCandidates(c); setStats(s); })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="p-8 text-gray-400">Loading...</div></div>;

  const recent = candidates.slice(0, 6);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto p-6">

        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Good morning, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-sm text-gray-500 mt-0.5">Here's what's happening today.</p>
        </div>

        {/* Pipeline overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
          {PIPELINE_GROUPS.map(g => {
            const count = g.statuses.reduce((acc, s) => acc + (stats[s] || 0), 0);
            return (
              <Link key={g.label} href={`/candidates?status=${g.statuses[0]}`}
                className={`rounded-xl border p-3 ${g.color} hover:shadow-sm transition-shadow`}>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-600 mt-0.5 leading-tight">{g.label}</p>
              </Link>
            );
          })}
        </div>

        {/* Alerts */}
        <AlertsSection />

        {/* Recent candidates */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-700">Recent candidates</h2>
            <Link href="/candidates" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {recent.map(c => (
              <Link key={c.id} href={`/candidates/${c.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.full_name}</p>
                  <p className="text-xs text-gray-400">{c.email} · {c.roles?.role_name}</p>
                </div>
                <StatusBadge status={c.status} />
              </Link>
            ))}
            {candidates.length === 0 && (
              <p className="px-4 py-8 text-sm text-gray-400 text-center">No candidates yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Shows time-sensitive alerts
function AlertsSection() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    api.candidates.list().then(all => {
      const today = new Date();
      const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
      const in7 = new Date(); in7.setDate(today.getDate() + 7);
      const items = [];

      all.forEach(c => {
        if (c.trial_end) {
          const end = new Date(c.trial_end);
          if (end <= tomorrow) items.push({ type: 'urgent', msg: `⚠️ ${c.full_name}'s trial ends TOMORROW`, id: c.id });
          else if (end <= in7) items.push({ type: 'warn', msg: `🕐 ${c.full_name}'s trial ends in 7 days`, id: c.id });
        }
        if (c.offer_deadline && c.status === 'offer_sent') {
          const dl = new Date(c.offer_deadline);
          if (dl <= in7) items.push({ type: 'warn', msg: `📋 ${c.full_name}'s offer expires ${c.offer_deadline}`, id: c.id });
        }
        if (c.status === 'docs_submitted') {
          items.push({ type: 'info', msg: `📁 ${c.full_name} submitted documents — verify them`, id: c.id });
        }
      });

      setAlerts(items.slice(0, 5));
    }).catch(() => { });
  }, []);

  if (!alerts.length) return null;

  const colors = { urgent: 'bg-red-50 border-red-200 text-red-800', warn: 'bg-amber-50 border-amber-200 text-amber-800', info: 'bg-blue-50 border-blue-200 text-blue-800' };

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium text-gray-700">Action required</h2>
      {alerts.map((a, i) => (
        <Link key={i} href={`/candidates/${a.id}`}
          className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm ${colors[a.type]}`}>
          <span>{a.msg}</span>
          <span className="text-xs opacity-60">View →</span>
        </Link>
      ))}
    </div>
  );
}
