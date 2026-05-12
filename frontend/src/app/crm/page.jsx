'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { getUser, api } from '../../lib/api';
import { supabase } from '../../config/supabase';

const PIPELINE_STAGES = [
  { id: 'New Lead', title: 'New Leads', color: 'bg-blue-50' },
  { id: 'Claimed', title: 'Claimed', color: 'bg-gray-50' },
  { id: 'Contacted', title: 'Contacted', color: 'bg-indigo-50' },
  { id: 'Site Visit Completed', title: 'Site Visit', color: 'bg-amber-50' },
  { id: 'Qualified', title: 'Qualified', color: 'bg-purple-50' },
  { id: 'Closed Won', title: 'Closed Won ✓', color: 'bg-green-50' },
  { id: 'Closed Lost', title: 'Closed Lost ✗', color: 'bg-red-50' },
];

export default function CRMDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [leads, setLeads] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open'); // all | open | hot | visits | won
  const [showRevenueModal, setShowRevenueModal] = useState(false);

  const [selectedAgent, setSelectedAgent] = useState(null);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push('/login'); return; }
    setUser(u);
    fetchData();

    // PRODUCTION GRADE: Aggressive WebSocket Lock
    const leadChannel = supabase.channel('leads-total-sync')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'leads' }, 
        () => {
          console.log('[REALTIME] Database Pulse Detected — Syncing...');
          fetchData();
        }
      ).subscribe();

    // FAIL-SAFE: 30s Tactical Heartbeat
    const heartbeat = setInterval(() => {
      console.log('[HEARTBEAT] Tactical Refresh Active');
      fetchData();
    }, 30000);

    return () => { 
      supabase.removeChannel(leadChannel);
      clearInterval(heartbeat);
    };
  }, [router]);

  async function fetchData() {
    try {
      const data = await api.crm.leads.list({ limit: 1000 });
      setLeads(data);
      
      const recent = data
        .filter(l => l.updated_at)
        .sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, 10);
      setActivities(recent);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // PLATINUM UTILITY: Single Source of Truth for Lead Identity
  const getLeadLabel = (lead) => lead.client_name || `LEAD-${lead.id?.substring(0, 5).toUpperCase()}`;
  const getStageColor = (stage) => {
    if (stage === 'Closed Won') return 'bg-green-100 text-green-700 border-green-200';
    if (stage === 'Closed Lost') return 'bg-red-100 text-red-700 border-red-200';
    if (stage.includes('Visit')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (stage === 'Contacted') return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const filteredLeads = leads.filter(l => {
    if (filter === 'open') return !l.assigned_to;
    if (filter === 'hot') return l.interest_level === 'Hot';
    if (filter === 'visits') return l.stage.includes('Visit');
    if (filter === 'won') return l.stage === 'Closed Won';
    return true;
  });

  const stats = {
    open: leads.filter(l => !l.assigned_to).length,
    won: leads.filter(l => l.stage === 'Closed Won').length,
    achievedRev: leads.filter(l => l.stage === 'Closed Won').length * 12.5,
    pipelineRev: leads.length * 12.5,
    hot: leads.filter(l => l.interest_level === 'Hot').length,
    visits: leads.filter(l => l.stage.includes('Visit')).length
  };

  if (loading) return <div className="p-12 font-black text-gray-200 animate-pulse tracking-[0.4em] uppercase text-center">SYNCHRONIZING COMMAND CENTER...</div>;

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans">
      <Navbar />
      
      <div className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-10">
        
        {/* Header: Action Focus */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
           <div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Command Center</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">Nelu Platinum Operational Intelligence</p>
           </div>
           <div className="flex gap-3">
              <Link href="/crm/leads/new" className="bg-[#014905] text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-green-800 shadow-xl shadow-green-900/10 transition-all active:scale-95">
                 + Deploy Lead
              </Link>
           </div>
        </div>

        {/* FUNCTIONAL COMMAND CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
           <button onClick={() => setFilter('open')} 
             className={`p-6 rounded-[2rem] border transition-all text-left group ${filter === 'open' ? 'bg-white border-[#014905] shadow-xl ring-1 ring-[#014905]' : 'bg-white border-gray-100 shadow-sm hover:border-gray-300'}`}>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover:text-[#014905]">Open Leads</p>
              <p className="text-3xl font-black text-gray-900">{stats.open}</p>
           </button>
           
           <button onClick={() => setFilter('hot')}
             className={`p-6 rounded-[2rem] border transition-all text-left group ${filter === 'hot' ? 'bg-white border-red-500 shadow-xl ring-1 ring-red-500' : 'bg-white border-gray-100 shadow-sm hover:border-red-100'}`}>
              <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">Hot Ops</p>
              <p className="text-3xl font-black text-red-600">{stats.hot}</p>
           </button>

           <button onClick={() => setFilter('visits')}
             className={`p-6 rounded-[2rem] border transition-all text-left group ${filter === 'visits' ? 'bg-white border-blue-500 shadow-xl ring-1 ring-blue-500' : 'bg-white border-gray-100 shadow-sm hover:border-blue-100'}`}>
              <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Site Visits</p>
              <p className="text-3xl font-black text-blue-600">{stats.visits}</p>
           </button>

           <button onClick={() => setFilter('won')}
             className={`p-6 rounded-[2rem] border transition-all text-left group ${filter === 'won' ? 'bg-white border-green-500 shadow-xl ring-1 ring-green-500' : 'bg-white border-gray-100 shadow-sm hover:border-green-100'}`}>
              <p className="text-[9px] font-black text-green-400 uppercase tracking-widest mb-1">Closed Won</p>
              <p className="text-3xl font-black text-green-600">{stats.won}</p>
           </button>

           <button 
             onClick={() => setShowRevenueModal(true)}
             className="bg-[#FC922E] p-6 rounded-[2rem] shadow-xl relative overflow-hidden text-left hover:scale-[1.02] transition-all active:scale-95 group">
              <div className="absolute top-0 right-0 h-24 w-24 bg-white/10 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform"></div>
              <p className="text-[9px] font-black text-white/70 uppercase tracking-widest mb-1 relative">Est. Revenue</p>
              <p className="text-2xl font-black text-white relative">₹{stats.pipelineRev.toFixed(1)}L</p>
              <p className="text-[8px] text-white/50 font-black uppercase mt-2 relative">Click for Breakdown &rarr;</p>
           </button>
        </div>

        {/* REVENUE INTELLIGENCE MODAL */}
        {showRevenueModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/40">
            <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
               <div className="bg-[#FC922E] p-10 text-white relative">
                  <button onClick={() => setShowRevenueModal(false)} className="absolute top-8 right-8 text-white/50 hover:text-white font-black">CLOSE ✕</button>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70 mb-2">Financial Intelligence</p>
                  <h2 className="text-4xl font-black tracking-tighter">Revenue Analysis</h2>
               </div>
               <div className="p-10 space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                     <div className="bg-green-50 p-6 rounded-3xl border border-green-100">
                        <p className="text-[9px] font-black text-green-600 uppercase tracking-widest mb-2">Achieved Revenue</p>
                        <p className="text-3xl font-black text-green-900">₹{stats.achievedRev.toFixed(1)}L</p>
                        <p className="text-[10px] text-green-500 font-bold mt-1">{stats.won} Deals Closed</p>
                     </div>
                     <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100">
                        <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-2">Pipeline Potential</p>
                        <p className="text-3xl font-black text-orange-900">₹{stats.pipelineRev.toFixed(1)}L</p>
                        <p className="text-[10px] text-orange-500 font-bold mt-1">{leads.length} Total Signals</p>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Logic & Calculation</h4>
                     <div className="bg-gray-50 p-6 rounded-2xl space-y-4">
                        <div className="flex justify-between items-center">
                           <span className="text-xs font-bold text-gray-500">Average Project Value</span>
                           <span className="text-xs font-black text-gray-900">₹12,50,000</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                           <span className="text-xs font-bold text-gray-500">Algorithm</span>
                           <span className="text-xs font-black text-gray-900">(Total Leads) × (Avg Value)</span>
                        </div>
                     </div>
                  </div>

                  <button 
                    onClick={() => setShowRevenueModal(false)}
                    className="w-full bg-[#014905] text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-green-800 transition-all">
                    Return to Mission Control
                  </button>
               </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           
           {/* MAIN FEED: Operational Intelligence */}
           <div className="lg:col-span-8 space-y-8">
              <div className="flex items-center justify-between">
                 <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">
                     {filter === 'open' ? 'Unclaimed Opportunity Pool' : 
                      filter === 'all' ? 'Real-Time Intelligence Stream' : `Filtered: ${filter.toUpperCase()}`}
                 </h3>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 rounded-full border border-green-100">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                      <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Stream Active</span>
                    </div>
                    {filter !== 'open' && <button onClick={() => setFilter('open')} className="text-[10px] font-black text-[#014905] underline uppercase ml-4">Show Open Leads</button>}
                  </div>
              </div>

              <div className="space-y-4">
                 {filteredLeads.map(lead => (
                   <Link href={`/crm/leads/${lead.id}`} key={lead.id} className="block bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all group">
                      <div className="flex items-center justify-between gap-4">
                         <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-xl shadow-inner group-hover:bg-[#014905] group-hover:text-white transition-all">
                               {lead.property_type === 'Resort' ? '🏝️' : lead.property_type === 'Hotel' ? '🏨' : '🏗️'}
                            </div>
                            <div>
                                <h4 className="font-black text-gray-900 text-lg tracking-tight">{getLeadLabel(lead)}</h4>
                               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                   {lead.business_name || lead.property_type || "Property Pending"} • {lead.location_label || "Location Pending"}
                                </p>
                            </div>
                         </div>
                          <div className="text-right">
                              <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStageColor(lead.stage)}`}>{lead.stage}</span>                             <p className="text-[9px] text-gray-300 font-bold mt-2 uppercase tracking-tighter">Updated {new Date(lead.updated_at).toLocaleTimeString()}</p>
                          </div>
                      </div>
                   </Link>
                 ))}
                 {filteredLeads.length === 0 && (
                    <div className="py-20 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100">
                       <p className="text-xs font-black text-gray-300 uppercase tracking-widest">Zero signals detected in this stream.</p>
                    </div>
                 )}
              </div>
           </div>

           {/* SIDEBAR: System Health & Top Agents */}
           <div className="lg:col-span-4 space-y-8">
              <div className="bg-[#014905] p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                 <div className="absolute bottom-0 right-0 h-40 w-40 bg-white/5 rounded-full -mb-20 -mr-20"></div>
                 <h4 className="text-[10px] font-black text-green-300 uppercase tracking-[0.2em] mb-6">Field Force Status</h4>
                 <div className="space-y-6">
                    {Object.entries(
                      leads.reduce((acc, l) => {
                        if (l.users?.name) {
                          acc[l.users.name] = (acc[l.users.name] || 0) + 1;
                        }
                        return acc;
                      }, {})
                    ).sort((a, b) => b[1] - a[1]).map(([name, count]) => (
                      <button 
                        key={name} 
                        onClick={() => setSelectedAgent(name)}
                        className="w-full flex items-center justify-between text-white hover:bg-white/5 p-2 rounded-xl transition-all group">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-black text-[10px] uppercase group-hover:bg-[#FC922E] group-hover:text-white transition-all">{name.charAt(0)}</div>
                            <span className="text-xs font-bold">{name}</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">{count} Claims</span>
                            <span className="text-white/20 group-hover:text-white transition-all">&rarr;</span>
                         </div>
                      </button>
                    ))}
                    {leads.filter(l => l.assigned_to).length === 0 && (
                      <p className="text-[9px] font-black text-green-300/40 uppercase text-center py-4">Zero Field Activity</p>
                    )}
                 </div>
                 <button onClick={() => setFilter('all')} className="w-full mt-8 bg-white/10 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">View All Field Activity</button>
              </div>

              {/* AGENT INTELLIGENCE MODAL */}
              {selectedAgent && (
                <div className="fixed inset-0 z-[101] flex items-center justify-center p-6 backdrop-blur-sm bg-black/40">
                  <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                    <div className="bg-[#014905] p-10 text-white relative">
                       <button onClick={() => setSelectedAgent(null)} className="absolute top-8 right-8 text-white/50 hover:text-white font-black">CLOSE ✕</button>
                       <div className="flex items-center gap-4 mb-2">
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-black text-lg uppercase">{selectedAgent.charAt(0)}</div>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Agent Operational Brief</p>
                       </div>
                       <h2 className="text-4xl font-black tracking-tighter">{selectedAgent}'s Pipeline</h2>
                    </div>
                    <div className="p-10">
                       <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                          {leads.filter(l => l.users?.name === selectedAgent).map(lead => (
                            <Link href={`/crm/leads/${lead.id}`} key={lead.id} className="block p-5 rounded-2xl border border-gray-100 hover:border-[#014905] hover:shadow-lg transition-all group">
                               <div className="flex justify-between items-center">
                                  <div>
                                     <h4 className="font-black text-gray-900 group-hover:text-[#014905] transition-colors">{getLeadLabel(lead)}</h4>
                                     <p className="text-[10px] text-gray-400 font-bold uppercase">{lead.property_type || 'Property Pending'} • {lead.location_label || 'Location TBD'}</p>
                                  </div>
                                  <span className={`text-[9px] font-black px-3 py-1 rounded-lg border uppercase tracking-widest ${getStageColor(lead.stage)}`}>{lead.stage}</span>
                               </div>
                            </Link>
                          ))}
                       </div>
                       <button 
                         onClick={() => setSelectedAgent(null)}
                         className="w-full mt-8 bg-gray-900 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">
                         Return to Command Center
                       </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Quick Tools</h4>
                 <div className="space-y-3">
                    <Link href="/crm/import" className="block w-full border-2 border-gray-50 py-4 rounded-2xl text-[10px] font-black text-center uppercase tracking-widest hover:border-[#FC922E] transition-all">Bulk Import Center</Link>
                    <button onClick={() => alert('Exporting Report...')} className="w-full border-2 border-gray-50 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-[#014905] transition-all">Download Master Sheet</button>
                 </div>
              </div>

           </div>

        </div>
      </div>
    </div>
  );
}
