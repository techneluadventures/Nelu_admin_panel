'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../lib/api';
import Navbar from '../../components/Navbar';
import StatusBadge from '../../components/StatusBadge';

const ALL_STATUSES = [
  'applied', 'shortlisted', 'interview_scheduled', 'interview_done',
  'selected', 'rejected', 'offer_sent', 'offer_accepted', 'offer_declined',
  'pre_boarding', 'trial', 'probation_extended', 'trial_terminated',
  'docs_pending', 'docs_submitted', 'docs_verified',
  'confirmed', 'active', 'resigned', 'terminated', 'offboarded',
];

export default function CandidatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [candidates, setCandidates] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(searchParams.get('status') || '');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({ full_name: '', email: '', phone: '', role_id: '' });
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState('');

  useEffect(() => {
    Promise.all([api.candidates.list({ status: filter, search }), api.roles.list()])
      .then(([c, r]) => { setCandidates(c); setRoles(r); })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [filter, search]);

  async function handleInvite(e) {
    e.preventDefault();
    setSaving(true); setFormErr('');
    try {
      const c = await api.candidates.create(form);
      setCandidates(prev => [c, ...prev]);
      setShowForm(false);
      setForm({ full_name: '', email: '', phone: '', role_id: '' });
    } catch (err) { setFormErr(err.message); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="p-8 text-gray-400">Loading...</div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">
            Candidates <span className="text-gray-400 font-normal text-base">({candidates.length})</span>
          </h1>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800">
            + Add candidate
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email..."
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:border-gray-400" />
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
            <option value="">All statuses</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
          {filter && <button onClick={() => setFilter('')} className="text-xs text-gray-400 hover:text-gray-700">Clear filter</button>}
        </div>

        {/* Invite form */}
        {showForm && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
            <h2 className="text-sm font-medium text-gray-700 mb-4">Add new candidate</h2>
            <form onSubmit={handleInvite} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Full name *</label>
                  <input required value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    placeholder="Rahul Sharma" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Email *</label>
                  <input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    placeholder="rahul@email.com" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Phone</label>
                  <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    placeholder="+91 9876543210" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Role *</label>
                  <select required value={form.role_id} onChange={e => setForm(p => ({ ...p, role_id: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                    <option value="">Select role</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.role_name}</option>)}
                  </select>
                </div>
              </div>
              {formErr && <p className="text-xs text-red-600">{formErr}</p>}
              <div className="flex gap-2">
                <button type="submit" disabled={saving}
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
                  {saving ? 'Adding...' : 'Add & send invite email'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {candidates.map(c => (
            <Link key={c.id} href={`/candidates/${c.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">{c.full_name}</p>
                  {c.employee_id && <span className="text-xs text-gray-400 font-mono">{c.employee_id}</span>}
                </div>
                <p className="text-xs text-gray-400">{c.email} · {c.roles?.role_name}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={c.status} />
                <span className="text-xs text-gray-300">→</span>
              </div>
            </Link>
          ))}
          {candidates.length === 0 && (
            <p className="px-4 py-10 text-sm text-gray-400 text-center">
              No candidates found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
