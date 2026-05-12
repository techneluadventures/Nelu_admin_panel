'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import { getUser, api } from '../lib/api';
import { supabase } from '../config/supabase';

export default function EmployeeMissionControl() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [myLeads, setMyLeads] = useState([]);
  const [poolLeads, setPoolLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pool'); // pool | pipeline | hot | visits | won

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push('/login'); return; }
    setUser(u);
    fetchData(u.id);

    // PRODUCTION GRADE: Aggressive WebSocket Lock
    const leadChannel = supabase.channel('leads-field-sync')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'leads' }, 
        () => {
          console.log('[REALTIME] Tactical Pulse Detected — Syncing...');
          fetchData(u.id);
        }
      ).subscribe();

    // FAIL-SAFE: 30s Tactical Heartbeat
    const heartbeat = setInterval(() => {
      fetchData(u.id);
    }, 30000);

    return () => { 
      supabase.removeChannel(leadChannel);
      clearInterval(heartbeat);
    };
  }, [router]);

  async function fetchData(userId) {
    try {
      const all = await api.crm.leads.list({ limit: 1000 });
      setMyLeads(all.filter(l => l.assigned_to === userId));
      setPoolLeads(all.filter(l => !l.assigned_to));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const stats = {
    open: poolLeads.length,
    pipeline: myLeads.length,
    hot: myLeads.filter(l => l.interest_level === 'Hot').length,
    visits: myLeads.filter(l => l.stage.includes('Visit')).length,
    won: myLeads.filter(l => l.stage === 'Closed Won').length
  };

  const displayLeads = (() => {
    if (activeTab === 'pool') return poolLeads;
    if (activeTab === 'hot') return myLeads.filter(l => l.interest_level === 'Hot');
    if (activeTab === 'visits') return myLeads.filter(l => l.stage.includes('Visit'));
    if (activeTab === 'won') return myLeads.filter(l => l.stage === 'Closed Won');
    return myLeads;
  })();

  const getLeadLabel = (lead) => lead.client_name || `LEAD-${lead.id?.substring(0, 5).toUpperCase()}`;
  const getStageColor = (stage) => {
    if (stage === 'Closed Won') return 'bg-green-100 text-green-700 border-green-200';
    if (stage === 'Closed Lost') return 'bg-red-100 text-red-700 border-red-200';
    if (stage.includes('Visit')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (stage === 'Contacted') return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  async function handleClaim(e, id) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.crm.leads.claim(id);
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) return <div className="p-12 font-black text-gray-300 animate-pulse tracking-[0.4em] uppercase text-center">SYNCHRONIZING MISSION DATA...</div>;

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans">
      <Navbar />
      
      <div className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-10">
        
        {/* Header: Tactical Briefing */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
           <div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Mission Control</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">Agent: <span className="text-[#014905]">{user?.name}</span> • Field Status Active</p>
           </div>
           <Link href="/leads/new" className="bg-[#014905] text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-green-800 shadow-xl shadow-green-900/10 transition-all active:scale-95">
              + Deploy New Lead
           </Link>
        </div>

        {/* FUNCTIONAL MISSION CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
           <button onClick={() => setActiveTab('pool')}
             className={`p-6 rounded-[2rem] border transition-all text-left relative overflow-hidden ${activeTab === 'pool' ? 'bg-[#014905] border-[#014905] shadow-xl text-white' : 'bg-white border-gray-100 shadow-sm hover:border-green-100'}`}>
              <div className={`absolute top-0 right-0 h-20 w-20 rounded-full -mr-10 -mt-10 ${activeTab === 'pool' ? 'bg-white/10' : 'bg-green-50'}`}></div>
              <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${activeTab === 'pool' ? 'text-green-300' : 'text-green-500'}`}>Open Leads</p>
              <p className={`text-3xl font-black ${activeTab === 'pool' ? 'text-white' : 'text-gray-900'}`}>{stats.open}</p>
           </button>

           <button onClick={() => setActiveTab('pipeline')}
             className={`p-6 rounded-[2rem] border transition-all text-left ${activeTab === 'pipeline' ? 'bg-white border-[#014905] shadow-xl ring-1 ring-[#014905]' : 'bg-white border-gray-100 shadow-sm hover:border-green-100'}`}>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">My Missions</p>
              <p className="text-3xl font-black text-gray-900">{stats.pipeline}</p>
           </button>
           
           <button onClick={() => setActiveTab('hot')}
             className={`p-6 rounded-[2rem] border transition-all text-left relative overflow-hidden ${activeTab === 'hot' ? 'bg-white border-red-500 shadow-xl ring-1 ring-red-500' : 'bg-white border-gray-100 shadow-sm hover:border-red-100'}`}>
              <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">Hot Priorities</p>
              <p className="text-3xl font-black text-red-600">{stats.hot}</p>
              {stats.hot > 0 && <div className="absolute top-0 right-0 h-2 w-2 bg-red-500 animate-ping m-6"></div>}
           </button>

           <button onClick={() => setActiveTab('visits')}
             className={`p-6 rounded-[2rem] border transition-all text-left ${activeTab === 'visits' ? 'bg-white border-blue-500 shadow-xl ring-1 ring-blue-500' : 'bg-white border-gray-100 shadow-sm hover:border-blue-100'}`}>
              <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Total Visits</p>
              <p className="text-3xl font-black text-blue-600">{stats.visits}</p>
           </button>

           <button onClick={() => setActiveTab('won')}
             className={`p-6 rounded-[2rem] border transition-all text-left ${activeTab === 'won' ? 'bg-white border-green-500 shadow-xl ring-1 ring-green-500' : 'bg-white border-gray-100 shadow-sm hover:border-green-100'}`}>
              <p className="text-[9px] font-black text-green-400 uppercase tracking-widest mb-1">Closed Won</p>
              <p className="text-3xl font-black text-green-600">{stats.won}</p>
           </button>
        </div>

        {/* Intelligence Stream Container */}
        <div className="space-y-8">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">
                 {activeTab === 'pipeline' ? 'My Tactical Assignments' : 
                  activeTab === 'pool' ? 'Unclaimed Opportunity Pool' :
                  activeTab === 'hot' ? 'Hot Priority Targets' : 
                  activeTab === 'won' ? 'Successful Missions (Won)' : 'Site Visit Missions'}
              </h3>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 rounded-full border border-green-100">
                <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                <span className="text-[8px] font-black text-green-600 uppercase tracking-[0.2em]">Live Sync</span>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayLeads.map(lead => (
                 <div key={lead.id} onClick={() => router.push(`/leads/${lead.id}`)} 
                   className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:scale-[1.02] transition-all group flex flex-col justify-between h-80 cursor-pointer">
                    <div>
                       <div className="flex justify-between items-start mb-6">
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                             lead.interest_level === 'Hot' ? 'bg-red-50 text-red-500 border-red-100' : 'bg-gray-50 text-gray-500 border-gray-100'
                          }`}>{lead.interest_level}</span>
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStageColor(lead.stage)}`}>{lead.stage}</span>
                       </div>
                       <h4 className="text-2xl font-black text-gray-900 tracking-tighter mb-1 truncate">{getLeadLabel(lead)}</h4>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{lead.property_type || 'Property Pending'} • {lead.location_label || 'Location TBD'}</p>
                    </div>
                    
                    <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                       <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">ID: {lead.id?.substring(0,6)}</span>
                       {activeTab === 'pool' ? (
                         <button onClick={(e) => handleClaim(e, lead.id)} className="bg-[#014905] text-white px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-green-800 transition-all shadow-lg shadow-green-900/20">Claim Lead</button>
                       ) : (
                         <span className="text-[#FC922E] text-[10px] font-black uppercase tracking-widest group-hover:translate-x-1 transition-all">Details &rarr;</span>
                       )}
                    </div>
                 </div>
              ))}
              {displayLeads.length === 0 && (
                 <div className="col-span-full py-20 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
                    <p className="text-xs font-black text-gray-300 uppercase tracking-[0.2em]">Zero tactical data in this sector</p>
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
