'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../../components/Navbar';
import { api, getUser } from '../../../../lib/api';

export default function NewLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState({
    client_name: '',
    business_name: '',
    phone: '',
    whatsapp: '',
    email: '',
    location_label: '',
    location_lat: null,
    location_lng: null,
    property_type: 'Resort',
    property_area: '',
    activities_interest: [],
    budget_range: '5-10 Lakhs',
    source: 'Cold Call',
    stage: 'New Lead'
  });

  useEffect(() => { setMounted(true); }, []);

  const activities = ['Zipline', 'Rope Course', 'Climbing Wall', 'Camping', 'Multi-activity Package'];
  const propertyTypes = ['Resort', 'Farmstay', 'Campsite', 'Hotel', 'School', 'Corporate'];

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.crm.leads.create(form);
      router.push('/crm');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans">
      <Navbar />
      <div className="flex-1 max-w-4xl mx-auto w-full p-6">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10">
          <div className="mb-10">
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Lead Acquisition</h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Manual Entry Hub • Nelu Platinum Standard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Identity Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Lead Name (Owner/Client) *</label>
                  <input type="text" required value={form.client_name}
                    onChange={e => setForm({...form, client_name: e.target.value})}
                    className="w-full border-b-2 border-gray-100 py-3 text-lg font-bold focus:outline-none focus:border-[#014905] transition-all"
                    placeholder="e.g. John Wick" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Business / Property Name</label>
                  <input type="text" value={form.business_name}
                    onChange={e => setForm({...form, business_name: e.target.value})}
                    className="w-full border-b-2 border-gray-100 py-3 text-lg font-bold focus:outline-none focus:border-[#014905] transition-all"
                    placeholder="e.g. Continental Resort" />
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Contact Intelligence (Phone) *</label>
                  <input type="tel" required value={form.phone}
                    onChange={e => setForm({...form, phone: e.target.value})}
                    className="w-full border-b-2 border-gray-100 py-3 text-lg font-bold focus:outline-none focus:border-[#014905] transition-all"
                    placeholder="+91 ..." />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">WhatsApp Channel</label>
                  <input type="tel" value={form.whatsapp}
                    onChange={e => setForm({...form, whatsapp: e.target.value})}
                    className="w-full border-b-2 border-gray-100 py-3 text-lg font-bold focus:outline-none focus:border-[#014905] transition-all" />
                </div>
              </div>
            </div>

            {/* Spatial Intelligence Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-gray-50">
              <div className="md:col-span-2">
                 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Property Coordinates (Google Maps Link/Label)</label>
                 <input type="text" value={form.location_label}
                    onChange={e => setForm({...form, location_label: e.target.value})}
                    className="w-full border-b-2 border-gray-100 py-3 text-sm font-bold focus:outline-none focus:border-[#014905] transition-all"
                    placeholder="e.g. Jubilee Hills, Hyderabad" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Property Type</label>
                <select value={form.property_type}
                  onChange={e => setForm({...form, property_type: e.target.value})}
                  className="w-full border-b-2 border-gray-100 py-3 text-sm font-bold focus:outline-none bg-white">
                  {propertyTypes.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Requirements Section */}
            <div className="pt-8 border-t border-gray-50">
               <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Activities of Interest</label>
               <div className="flex flex-wrap gap-3">
                  {activities.map(act => (
                    <button type="button" key={act}
                      onClick={() => {
                        const next = form.activities_interest.includes(act)
                          ? form.activities_interest.filter(a => a !== act)
                          : [...form.activities_interest, act];
                        setForm({...form, activities_interest: next});
                      }}
                      className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                        form.activities_interest.includes(act) ? 'bg-[#014905] text-white border-[#014905]' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'
                      }`}>{act}</button>
                  ))}
               </div>
            </div>

            {/* Logistics Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-gray-50">
               <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Estimated Area</label>
                  <input type="text" value={form.property_area}
                    onChange={e => setForm({...form, property_area: e.target.value})}
                    className="w-full border-b-2 border-gray-100 py-3 text-sm font-bold focus:outline-none"
                    placeholder="e.g. 5 Acres" />
               </div>
               <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Budget Range</label>
                  <select value={form.budget_range}
                    onChange={e => setForm({...form, budget_range: e.target.value})}
                    className="w-full border-b-2 border-gray-100 py-3 text-sm font-bold focus:outline-none bg-white">
                    <option>Under 5 Lakhs</option>
                    <option>5-10 Lakhs</option>
                    <option>10-25 Lakhs</option>
                    <option>25-50 Lakhs</option>
                    <option>50 Lakhs+</option>
                  </select>
               </div>
               <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Discovery Source</label>
                  <select value={form.source}
                    onChange={e => setForm({...form, source: e.target.value})}
                    className="w-full border-b-2 border-gray-100 py-3 text-sm font-bold focus:outline-none bg-white">
                    <option>Cold Call</option>
                    <option>Referral</option>
                    <option>Instagram</option>
                    <option>Google</option>
                    <option>Exhibition</option>
                    <option>Walk-in</option>
                  </select>
               </div>
            </div>

            <div className="pt-12 flex gap-4">
              <button type="button" onClick={() => router.back()}
                className="flex-1 border-2 border-gray-100 text-gray-400 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all">
                CANCEL
              </button>
              <button type="submit" disabled={loading}
                className="flex-[2] bg-[#014905] text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-green-800 shadow-xl shadow-green-900/10 transition-all disabled:opacity-50 active:scale-95">
                {loading ? 'SYNCHRONIZING...' : 'ACQUIRE LEAD'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
