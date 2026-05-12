'use client';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import Navbar from '../../components/Navbar';

const ROLE_TYPES = [
  { value: 'full_time', label: 'Full-Time' },
  { value: 'internship', label: 'Internship' },
  { value: 'contract', label: 'Contract' },
  { value: 'part_time', label: 'Part-Time' },
];

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ role_name: '', department: '', type: 'full_time' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.roles.list().then(setRoles).finally(() => setLoading(false));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true); setErr('');
    try {
      const r = await api.roles.create(form);
      setRoles(prev => [r, ...prev]);
      setShowForm(false);
      setForm({ role_name: '', department: '', type: 'full_time' });
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this role? Cannot be undone.')) return;
    await api.roles.delete(id);
    setRoles(prev => prev.filter(r => r.id !== id));
  }

  if (loading) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="p-8 text-gray-400">Loading...</div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Job Roles</h1>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800">
            + New role
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-xl p-5 mb-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Role name *</label>
                <input required value={form.role_name} onChange={e => setForm(p => ({ ...p, role_name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Software Developer" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Department</label>
                <input value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Engineering" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Type</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  {ROLE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            {err && <p className="text-xs text-red-600">{err}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={saving}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
                {saving ? 'Creating...' : 'Create role'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg">Cancel</button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {roles.map(r => (
            <div key={r.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{r.role_name}</p>
                <p className="text-xs text-gray-400">{r.department} · {r.type?.replace('_', ' ')}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-gray-300">{r.id.substring(0, 8)}</span>
                <button onClick={() => handleDelete(r.id)}
                  className="text-xs text-red-400 hover:text-red-600">Delete</button>
              </div>
            </div>
          ))}
          {roles.length === 0 && <p className="px-4 py-8 text-sm text-gray-400 text-center">No roles yet.</p>}
        </div>
      </div>
    </div>
  );
}
