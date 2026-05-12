'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../../components/Navbar';
import { api, getUser } from '../../../../lib/api';

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    products: [{ name: 'Zipline Installation', quantity: 1, price: 150000 }],
    installation_charges: 25000,
    gst_percent: 18
  });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (params.id) {
      api.crm.leads.get(params.id)
        .then(setLead)
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  const handleGenerateQuote = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await api.crm.leads.generateQuote({
        lead_id: lead.id,
        client_name: lead.client_name,
        property_name: lead.business_name || lead.resort_name,
        date: new Date().toLocaleDateString(),
        ...quoteForm
      });
      // Trigger download
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${res.pdf}`;
      link.download = `Nelu_Quotation_${lead.client_name.replace(' ', '_')}.pdf`;
      link.click();
      setShowQuoteModal(false);
    } catch (err) {
      alert('Quote generation failed: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStageUpdate = async (newStage) => {
    try {
      await api.crm.leads.update(lead.id, { stage: newStage });
      setLead({ ...lead, stage: newStage });
      alert(`MISSION UPDATED: Stage set to ${newStage}`);
    } catch (err) {
      alert('Transition Failed: ' + err.message);
    }
  };

  if (!mounted || !lead) return <div className="p-8 font-black text-gray-300 animate-pulse uppercase tracking-widest">LOADING MISSION BRIEF...</div>;

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans">
      <Navbar />
      <div className="flex-1 max-w-6xl mx-auto w-full p-6 md:p-10">
        
        {/* Platinum Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 border-b border-gray-100 pb-10">
           <div>
              <div className="flex items-center gap-3 mb-2">
                 <button onClick={() => router.back()} className="text-gray-400 hover:text-black">&larr; Pipeline</button>
                 <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Lead Identity: {lead.id?.substring(0,8)}</span>
              </div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-1">{lead.client_name}</h1>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{lead.business_name || 'Individual Lead'}</p>
           </div>
           <div className="flex items-center gap-4">
              <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                lead.interest_level === 'Hot' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'
              }`}>{lead.interest_level} Priority</span>
              <span className="bg-[#014905] text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">{lead.stage}</span>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           {/* Left: Intelligence & History */}
           <div className="lg:col-span-8 space-y-10">
              
              {/* Intelligence Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Contact Logic</h3>
                    <div className="space-y-4">
                       <div><p className="text-[9px] font-black text-gray-300 uppercase mb-1">Phone</p><p className="font-bold text-gray-900">{lead.phone}</p></div>
                       <div><p className="text-[9px] font-black text-gray-300 uppercase mb-1">WhatsApp</p><p className="font-bold text-gray-900">{lead.whatsapp || 'N/A'}</p></div>
                       <div><p className="text-[9px] font-black text-gray-300 uppercase mb-1">Email</p><p className="font-bold text-gray-900 truncate">{lead.email || 'N/A'}</p></div>
                    </div>
                 </div>
                 <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Property Intelligence</h3>
                    <div className="space-y-4">
                       <div><p className="text-[9px] font-black text-gray-300 uppercase mb-1">Type</p><p className="font-bold text-gray-900">{lead.property_type}</p></div>
                       <div><p className="text-[9px] font-black text-gray-300 uppercase mb-1">Location</p><p className="font-bold text-gray-900">{lead.location_label}</p></div>
                       <div><p className="text-[9px] font-black text-gray-300 uppercase mb-1">Interests</p><div className="flex flex-wrap gap-2">{lead.activities_interest?.map(a => <span key={a} className="bg-gray-50 text-[9px] font-black px-2 py-0.5 rounded border border-gray-100 uppercase">{a}</span>)}</div></div>
                    </div>
                 </div>
              </div>

              {/* Site Visit Timeline */}
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                 <div className="p-8 border-b border-gray-50 bg-gray-50/30">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Field Intelligence Stream</h3>
                 </div>
                 <div className="p-8 space-y-10">
                    {lead.site_visits?.map((v, i) => (
                      <div key={v.id} className="relative pl-10 border-l-2 border-gray-100 last:pb-0 pb-10">
                         <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-white border-2 border-[#014905]"></div>
                         <div className="flex justify-between items-start mb-4">
                            <div>
                               <p className="text-sm font-black text-gray-900 uppercase">{new Date(v.visit_date || v.created_at).toDateString()}</p>
                               <p className="text-[9px] font-bold text-gray-400 uppercase">Agent: {v.users?.name || 'Assigned Agent'}</p>
                            </div>
                            <span className="text-[9px] font-mono bg-gray-50 text-gray-500 px-2 py-1 rounded">LOC: {v.gps_lat?.toFixed(4)}, {v.gps_lng?.toFixed(4)}</span>
                         </div>
                         <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100/50">
                            <p className="text-sm text-gray-600 leading-relaxed mb-4">{v.discussion_summary}</p>
                            <div className="flex gap-2">
                               {v.items_discussed?.map(it => <span key={it} className="text-[8px] font-black bg-white border border-gray-100 px-2 py-0.5 rounded uppercase">{it}</span>)}
                            </div>
                         </div>
                      </div>
                    ))}
                    {(!lead.site_visits || lead.site_visits.length === 0) && (
                      <div className="py-12 text-center text-xs font-black text-gray-300 uppercase tracking-[0.2em]">Zero Field Data Captured</div>
                    )}
                 </div>
              </div>
           </div>

           {/* Right: Operational Hub */}
           <div className="lg:col-span-4 space-y-6">
              
              {/* Proposal Generation */}
              <div className="bg-[#014905] text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 h-32 w-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                 <h3 className="text-[10px] font-black text-green-300 uppercase tracking-widest mb-6 relative">Operational Hub</h3>
                 <p className="text-xs text-green-100 mb-8 relative">Ready to advance to Proposal Sent? Generate the digital quotation for client review.</p>
                 <button 
                   onClick={() => setShowQuoteModal(true)}
                   className="w-full bg-[#FC922E] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-orange-900/20 active:scale-95">
                   Generate Quotation PDF
                 </button>
              </div>

              {/* Quick Actions */}
              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                 <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Pipeline Velocity</h3>
                 <div className="space-y-3">
                    <button onClick={() => handleStageUpdate('Negotiation')} className="w-full border-2 border-gray-50 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-[#014905] transition-all">Move to Negotiation</button>
                    <button onClick={() => handleStageUpdate('Closed Won')} className="w-full bg-green-50 text-green-700 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-100 transition-all">✓ Mark Closed Won</button>
                    <button onClick={() => handleStageUpdate('Closed Lost')} className="w-full text-red-400 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-red-600 transition-all">✗ Mark Lead Lost</button>
                 </div>
              </div>

           </div>
        </div>

        {/* Quotation Builder Modal */}
        {showQuoteModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
             <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden">
                <div className="p-10 border-b border-gray-50">
                   <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase mb-1">Quotation Builder</h2>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Nelu Platinum Standard • Automated Generation</p>
                </div>
                <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto">
                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Line Items</p>
                      {quoteForm.products.map((p, i) => (
                        <div key={i} className="grid grid-cols-12 gap-4">
                           <input className="col-span-6 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-black text-gray-900 focus:ring-2 focus:ring-[#014905] outline-none transition-all" value={p.name} placeholder="Product Name" onChange={e => {
                             const next = [...quoteForm.products]; next[i].name = e.target.value; setQuoteForm({...quoteForm, products: next});
                           }} />
                           <input className="col-span-2 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-black text-gray-900 focus:ring-2 focus:ring-[#014905] outline-none transition-all" type="number" value={p.quantity} onChange={e => {
                             const next = [...quoteForm.products]; next[i].quantity = Number(e.target.value); setQuoteForm({...quoteForm, products: next});
                           }} />
                           <input className="col-span-4 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-black text-gray-900 focus:ring-2 focus:ring-[#014905] outline-none transition-all" type="number" value={p.price} onChange={e => {
                             const next = [...quoteForm.products]; next[i].price = Number(e.target.value); setQuoteForm({...quoteForm, products: next});
                           }} />
                        </div>
                      ))}
                      <button className="text-[9px] font-black text-[#014905] uppercase tracking-widest" onClick={() => setQuoteForm({...quoteForm, products: [...quoteForm.products, { name: '', quantity: 1, price: 0 }]})}>+ Add Item</button>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-8">
                      <div>
                         <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Installation Charges</label>
                         <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-black text-gray-900 focus:ring-2 focus:ring-[#014905] outline-none transition-all" type="number" value={quoteForm.installation_charges} onChange={e => setQuoteForm({...quoteForm, installation_charges: Number(e.target.value)})} />
                      </div>
                      <div>
                         <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">GST Percent (%)</label>
                         <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-black text-gray-900 focus:ring-2 focus:ring-[#014905] outline-none transition-all" type="number" value={quoteForm.gst_percent} onChange={e => setQuoteForm({...quoteForm, gst_percent: Number(e.target.value)})} />
                      </div>
                   </div>
                </div>
                <div className="p-10 flex gap-4 bg-gray-50/50">
                   <button onClick={() => setShowQuoteModal(false)} className="flex-1 bg-white border border-gray-100 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm">Cancel</button>
                   <button 
                     onClick={handleGenerateQuote} 
                     disabled={isGenerating}
                     className={`flex-[2] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all ${isGenerating ? 'bg-gray-400 cursor-not-allowed animate-pulse' : 'bg-[#014905] shadow-green-900/10 active:scale-95'}`}>
                     {isGenerating ? 'Generating Mission Brief...' : 'Generate & Download PDF'}
                   </button>
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
