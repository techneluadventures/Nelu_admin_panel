'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import { api, getUser } from '../../../lib/api';

export default function NewLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState({
    client_name: '',
    resort_name: '',
    contact_person: '',
    phone: '',
    email: '',
    location: '',
    category: 'Resort',
    interest_level: 'Warm',
    source: 'Field Visit'
  });

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = getUser();
      // Auto-assign to self if we're in the field app
      const payload = { ...form, assigned_to: user.id };
      await api.crm.leads.create(payload);
      router.push('/');
    } catch (err) {
      alert('Error creating lead: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-2xl mx-auto w-full p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Add New Lead</h1>
            <p className="text-sm text-gray-500">Capture details from the field site visit.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Client Name *</label>
                <input type="text" required value={form.client_name}
                  onChange={e => setForm({...form, client_name: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#014905] focus:border-[#014905] bg-white transition-all"
                  placeholder="e.g. John Smith" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Property/Resort Name</label>
                <input type="text" value={form.resort_name}
                  onChange={e => setForm({...form, resort_name: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#014905] focus:border-[#014905] bg-white transition-all"
                  placeholder="e.g. Blue Lagoon Resort" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Phone Number *</label>
                <input type="tel" required value={form.phone}
                  onChange={e => setForm({...form, phone: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#014905] focus:border-[#014905] bg-white transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Email</label>
                <input type="email" value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#014905] focus:border-[#014905] bg-white transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Location / GPS Address</label>
              <input type="text" value={form.location}
                onChange={e => setForm({...form, location: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#014905] focus:border-[#014905] bg-white transition-all"
                placeholder="e.g. Hyderabad, Telangana" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Category</label>
                <select value={form.category}
                  onChange={e => setForm({...form, category: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#014905] focus:border-[#014905] bg-white transition-all">
                  <option>Resort</option>
                  <option>Hotel</option>
                  <option>Commercial</option>
                  <option>Corporate</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Interest</label>
                <select value={form.interest_level}
                  onChange={e => setForm({...form, interest_level: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#014905] focus:border-[#014905] bg-white transition-all">
                  <option>Hot</option>
                  <option>Warm</option>
                  <option>Cold</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Source</label>
                <select value={form.source}
                  onChange={e => setForm({...form, source: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#014905] focus:border-[#014905] bg-white transition-all">
                  <option>Field Visit</option>
                  <option>Cold Call</option>
                  <option>WhatsApp</option>
                  <option>Referral</option>
                </select>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex gap-4">
              <button type="button" onClick={() => router.back()}
                className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-bold hover:bg-gray-50">
                CANCEL
              </button>
              <button type="submit" disabled={loading}
                className="flex-[2] bg-[#014905] text-white py-3 rounded-xl text-sm font-bold hover:bg-green-800 disabled:opacity-50">
                {loading ? 'SAVING...' : 'SAVE LEAD'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
