'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import { api, getUser } from '../../../lib/api';

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isVisitFormOpen, setIsVisitFormOpen] = useState(false);
  
  const [visitForm, setVisitForm] = useState({
    gps_lat: null,
    gps_lng: null,
    gps_accuracy_m: null,
    gps_captured_at: null,
    discussion_summary: '',
    items_discussed: [],
    client_objections: [],
    temperature: 'warm',
    next_action: 'quotation'
  });

  const DISCUSSION_ITEMS = ['Activities Shown', 'Safety Standards', 'Pricing', 'Timeline', 'Demo Video', 'Site Walkthrough', 'Competitor Comparison'];
  const OBJECTIONS = ['Price too high', 'Need time to think', 'Need board approval', 'Already have vendor', 'Not ready yet', 'Bad data'];

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (params.id) {
      api.crm.leads.get(params.id)
        .then(setLead)
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  // PLATINUM STANDARD: Capture GPS the moment form is opened
  const handleOpenVisitForm = () => {
    setIsVisitFormOpen(true);
    detectLocation();
  };

  function detectLocation() {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setVisitForm(prev => ({ 
            ...prev, 
            gps_lat: pos.coords.latitude, 
            gps_lng: pos.coords.longitude,
            gps_accuracy_m: pos.coords.accuracy,
            gps_captured_at: new Date().toISOString()
          }));
          setGpsLoading(false);
        },
        (err) => {
          alert('GPS ERROR: Accountability lock failed. Please enable location services.');
          setGpsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    }
  }

  async function handleLogVisit(e) {
    e.preventDefault();
    if (!visitForm.gps_lat || !visitForm.gps_lng) {
      alert('MANDATORY GPS LOCK REQUIRED. Cannot submit visit log without location authentication.');
      return;
    }
    if (visitForm.discussion_summary.length < 50) {
      alert('INSUFFICIENT DATA: Field notes must be at least 50 characters for quality reporting.');
      return;
    }

    try {
      await api.crm.leads.logVisit(lead.id, visitForm);
      alert('FIELD MISSION SYNCED SUCCESSFULLY');
      router.push('/');
    } catch (err) {
      alert('SYNC ERROR: ' + err.message);
    }
  }

  if (!mounted || !lead) return <div className="p-8 font-black text-gray-300 animate-pulse uppercase tracking-[0.3em]">SYNCHRONIZING SECURE TUNNEL...</div>;

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans">
      <Navbar />
      <div className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pb-8 border-b border-gray-100">
           <div>
              <div className="flex items-center gap-3 mb-2">
                 <button onClick={() => router.back()} className="h-8 w-8 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:text-black transition-all">&larr;</button>
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">MISSION ID: {lead.id?.substring(0,8)}</span>
              </div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-1">{lead.client_name}</h1>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{lead.business_name || lead.property_type || 'Nelu Opportunity'}</p>
           </div>
           <div className="flex items-center gap-4">
              <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                lead.interest_level === 'Hot' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'
              }`}>{lead.interest_level} Priority</span>
              <span className="bg-[#014905] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">{lead.stage}</span>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           
           {/* Intelligence Briefing */}
           <div className="lg:col-span-8 space-y-8">
              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                 <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8">Intelligence Briefing</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                       <p className="text-[10px] font-black text-gray-300 uppercase mb-2">Spatial Context</p>
                       <p className="text-sm font-bold text-gray-900 mb-4">{lead.location_label || 'Location N/A'}</p>
                       <p className="text-[10px] font-black text-gray-300 uppercase mb-2">Interests</p>
                       <div className="flex flex-wrap gap-2">
                          {lead.activities_interest?.map(a => <span key={a} className="px-2 py-1 bg-gray-50 text-[9px] font-black uppercase rounded border border-gray-100">{a}</span>)}
                       </div>
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-gray-300 uppercase mb-2">Budget Threshold</p>
                       <p className="text-sm font-bold text-gray-900 mb-4">{lead.budget_range}</p>
                       <p className="text-[10px] font-black text-gray-300 uppercase mb-2">Discovery Source</p>
                       <p className="text-sm font-bold text-gray-900">{lead.source}</p>
                    </div>
                 </div>
              </div>

              {/* Communication Hub */}
              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                 <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8">Rapid Communication Hub</h3>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <a href={`tel:${lead.phone}`} className="bg-gray-50 p-6 rounded-2xl flex flex-col items-center gap-3 hover:bg-[#014905] hover:text-white transition-all group shadow-sm">
                       <span className="text-2xl group-hover:scale-110 transition-transform">📞</span>
                       <span className="text-[9px] font-black uppercase tracking-widest">Voice</span>
                    </a>
                    <a href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`} target="_blank" className="bg-gray-50 p-6 rounded-2xl flex flex-col items-center gap-3 hover:bg-green-500 hover:text-white transition-all group shadow-sm">
                       <span className="text-2xl group-hover:scale-110 transition-transform">💬</span>
                       <span className="text-[9px] font-black uppercase tracking-widest">WhatsApp</span>
                    </a>
                    <button onClick={() => alert('Email Logging Interface Under Development')} className="bg-gray-50 p-6 rounded-2xl flex flex-col items-center gap-3 hover:bg-blue-500 hover:text-white transition-all group shadow-sm">
                       <span className="text-2xl group-hover:scale-110 transition-transform">✉️</span>
                       <span className="text-[9px] font-black uppercase tracking-widest">Email</span>
                    </button>
                    <button onClick={handleOpenVisitForm} className="bg-[#FC922E] p-6 rounded-2xl flex flex-col items-center gap-3 text-white hover:bg-orange-600 transition-all group shadow-lg">
                       <span className="text-2xl group-hover:scale-110 transition-transform">📍</span>
                       <span className="text-[9px] font-black uppercase tracking-widest">Log Visit</span>
                    </button>
                 </div>
              </div>
           </div>

           {/* Site Visit Logger (Platinum Standard Modal-ish) */}
           {isVisitFormOpen && (
              <div className="lg:col-span-12 fixed inset-0 z-50 bg-white/95 backdrop-blur-md p-6 overflow-y-auto">
                 <div className="max-w-3xl mx-auto">
                    <div className="flex justify-between items-center mb-12">
                       <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Field Accountability Log</h2>
                       <button onClick={() => setIsVisitFormOpen(false)} className="text-gray-400 font-bold hover:text-black transition-all">CLOSE</button>
                    </div>

                    <form onSubmit={handleLogVisit} className="space-y-12">
                       {/* GPS Accountability Lock */}
                       <div className="bg-[#014905] text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 h-32 w-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                          <div className="flex justify-between items-center mb-6">
                             <h3 className="text-[10px] font-black text-green-300 uppercase tracking-widest">MANDATORY GPS LOCK</h3>
                             {gpsLoading ? <span className="text-[10px] font-black animate-pulse text-orange-400">SIGNAL ACQUISITION...</span> : <span className="text-[10px] font-black text-green-400">AUTHENTICATED</span>}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                             <div>
                                <p className="text-[9px] font-black opacity-50 uppercase mb-1">LATITUDE/LONGITUDE</p>
                                <p className="text-sm font-mono tracking-tighter">{visitForm.gps_lat ? `${visitForm.gps_lat.toFixed(6)}, ${visitForm.gps_lng.toFixed(6)}` : 'PENDING...'}</p>
                             </div>
                             <div className="text-right">
                                <p className="text-[9px] font-black opacity-50 uppercase mb-1">PRECISION (METERS)</p>
                                <p className={`text-sm font-mono tracking-tighter ${visitForm.gps_accuracy_m > 50 ? 'text-red-400' : 'text-green-400'}`}>{visitForm.gps_accuracy_m ? `${visitForm.gps_accuracy_m.toFixed(1)}m` : '0.0m'}</p>
                             </div>
                          </div>
                          <p className="text-[8px] font-black opacity-40 uppercase mt-4 tracking-widest">Capturing timestamp: {visitForm.gps_captured_at || 'AWAITING LOCK'}</p>
                       </div>

                       {/* Discussion Sections */}
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                          <div>
                             <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Operational Brief</h4>
                             <div className="flex flex-wrap gap-2">
                                {DISCUSSION_ITEMS.map(item => (
                                  <button type="button" key={item}
                                    onClick={() => {
                                       const next = visitForm.items_discussed.includes(item) ? visitForm.items_discussed.filter(i => i !== item) : [...visitForm.items_discussed, item];
                                       setVisitForm({...visitForm, items_discussed: next});
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                                      visitForm.items_discussed.includes(item) ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'
                                    }`}>{item}</button>
                                ))}
                             </div>
                          </div>
                          <div>
                             <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Client Objections</h4>
                             <div className="flex flex-wrap gap-2">
                                {OBJECTIONS.map(item => (
                                  <button type="button" key={item}
                                    onClick={() => {
                                       const next = visitForm.client_objections.includes(item) ? visitForm.client_objections.filter(i => i !== item) : [...visitForm.client_objections, item];
                                       setVisitForm({...visitForm, client_objections: next});
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                                      visitForm.client_objections.includes(item) ? 'bg-red-50 text-red-600 border-red-100' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'
                                    }`}>{item}</button>
                                ))}
                             </div>
                          </div>
                       </div>

                       {/* Detailed Notes */}
                       <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Detailed Field Intelligence (Min 50 Chars) *</label>
                          <textarea required rows="5" value={visitForm.discussion_summary}
                            onChange={e => setVisitForm({...visitForm, discussion_summary: e.target.value})}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#014905] focus:border-[#014905] transition-all"
                            placeholder="Detail activity placement, site access, client specific needs..."></textarea>
                          <p className="text-[9px] text-gray-400 mt-2 text-right uppercase font-bold tracking-widest">{visitForm.discussion_summary.length}/50 CHARS</p>
                       </div>

                       <div className="flex gap-8 border-t border-gray-100 pt-12 pb-12">
                          <button type="submit" className="flex-1 bg-[#014905] text-white py-6 rounded-[2rem] text-xs font-black uppercase tracking-widest hover:bg-green-800 shadow-2xl transition-all">
                             COMMIT FIELD MISSION & SYNC
                          </button>
                       </div>
                    </form>
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
}
