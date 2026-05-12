'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import Navbar from '../../../components/Navbar';
import { api } from '../../../lib/api';

export default function BulkImportPage() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Preview/Confirm

  const DB_FIELDS = [
    { id: 'client_name', label: 'Client Name (Owner) *' },
    { id: 'business_name', label: 'Property/Resort Name' },
    { id: 'phone', label: 'Phone Number *' },
    { id: 'email', label: 'Email Address' },
    { id: 'location_label', label: 'Location/District' },
    { id: 'property_type', label: 'Property Type' },
    { id: 'budget_range', label: 'Budget Range' },
    { id: 'source', label: 'Lead Source' },
  ];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFile(file);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvData(results.data);
        setHeaders(Object.keys(results.data[0]));
        // Auto-mapping logic
        const initialMapping = {};
        Object.keys(results.data[0]).forEach(h => {
          const matchedField = DB_FIELDS.find(f => h.toLowerCase().includes(f.id.replace('_', '')) || h.toLowerCase() === f.id);
          if (matchedField) initialMapping[matchedField.id] = h;
        });
        setMapping(initialMapping);
        setStep(2);
      }
    });
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      const formattedLeads = csvData.map(row => {
        const lead = {};
        Object.entries(mapping).forEach(([dbField, csvHeader]) => {
          lead[dbField] = row[csvHeader];
        });
        return lead;
      });

      const res = await api.crm.leads.importBulk({ leads: formattedLeads });
      alert(`Success: Imported ${res.imported} leads. ${res.skippedCount} were skipped as duplicates.`);
      router.push('/crm');
    } catch (err) {
      alert('Import failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans">
      <Navbar />
      <div className="flex-1 max-w-5xl mx-auto w-full p-6">
        
        {/* Step Indicator */}
        <div className="flex items-center gap-4 mb-12">
           <div className={`h-8 w-8 rounded-full flex items-center justify-center font-black text-xs border-2 ${step >= 1 ? 'bg-[#014905] text-white border-[#014905]' : 'border-gray-200 text-gray-300'}`}>1</div>
           <div className="h-0.5 w-12 bg-gray-100"></div>
           <div className={`h-8 w-8 rounded-full flex items-center justify-center font-black text-xs border-2 ${step >= 2 ? 'bg-[#014905] text-white border-[#014905]' : 'border-gray-200 text-gray-300'}`}>2</div>
           <div className="h-0.5 w-12 bg-gray-100"></div>
           <div className={`h-8 w-8 rounded-full flex items-center justify-center font-black text-xs border-2 ${step >= 3 ? 'bg-[#014905] text-white border-[#014905]' : 'border-gray-200 text-gray-300'}`}>3</div>
           <h1 className="ml-4 text-2xl font-black text-gray-900 tracking-tighter uppercase">Platinum Bulk Import</h1>
        </div>

        {step === 1 && (
          <div className="bg-white rounded-3xl border-2 border-dashed border-gray-100 p-20 flex flex-col items-center justify-center text-center">
             <div className="text-5xl mb-6">📊</div>
             <h2 className="text-xl font-black text-gray-900 mb-2">Upload Your Lead Database</h2>
             <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-8">CSV or Excel format accepted • Duplicates auto-detected</p>
             <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" id="csv-upload" />
             <label htmlFor="csv-upload" className="bg-[#014905] text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest cursor-pointer hover:bg-green-800 transition-all shadow-xl shadow-green-900/10">
                Choose File
             </label>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10">
             <h2 className="text-xl font-black text-gray-900 mb-8 uppercase tracking-tight">Column Mapping Engine</h2>
             <div className="space-y-6">
                {DB_FIELDS.map(field => (
                  <div key={field.id} className="grid grid-cols-2 gap-8 items-center border-b border-gray-50 pb-4">
                     <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{field.label}</p>
                        <p className="text-xs text-gray-300 font-bold uppercase">DB Field: <span className="text-[#014905]">{field.id}</span></p>
                     </div>
                     <select 
                       value={mapping[field.id] || ''}
                       onChange={e => setMapping({...mapping, [field.id]: e.target.value})}
                       className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none">
                       <option value="">-- Ignore this field --</option>
                       {headers.map(h => <option key={h} value={h}>{h}</option>)}
                     </select>
                  </div>
                ))}
             </div>
             <div className="pt-10 flex gap-4">
                <button onClick={() => setStep(1)} className="flex-1 border-2 border-gray-100 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-50">BACK</button>
                <button onClick={() => setStep(3)} className="flex-[2] bg-[#014905] text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-green-800 shadow-lg">CONTINUE TO PREVIEW</button>
             </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10">
             <h2 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Final Sync Preview</h2>
             <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-8">Ready to inject <span className="text-[#014905]">{csvData.length}</span> records into pipeline</p>
             
             <div className="overflow-x-auto border border-gray-50 rounded-2xl mb-10">
                <table className="w-full text-left text-xs">
                   <thead className="bg-gray-50">
                      <tr>
                         {Object.keys(mapping).map(k => <th key={k} className="px-4 py-3 font-black uppercase tracking-widest opacity-40">{k}</th>)}
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {csvData.slice(0, 5).map((row, i) => (
                        <tr key={i}>
                           {Object.entries(mapping).map(([db, csv]) => <td key={db} className="px-4 py-4 font-bold text-gray-600">{row[csv] || '-'}</td>)}
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>

             <div className="bg-orange-50 border border-orange-100 p-6 rounded-2xl mb-10">
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2">Deduplication Logic Active</p>
                <p className="text-xs text-orange-800 font-medium">The system will automatically generate SHA-256 phone hashes for all records. Any lead with an existing phone hash in the database will be skipped automatically to maintain data integrity.</p>
             </div>

             <div className="flex gap-4">
                <button onClick={() => setStep(2)} className="flex-1 border-2 border-gray-100 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-50">RE-MAP COLUMNS</button>
                <button onClick={handleImport} disabled={loading} className="flex-[2] bg-[#014905] text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-green-800 shadow-xl shadow-green-900/10">
                   {loading ? 'SYNCHRONIZING RECORDS...' : 'START BULK SYNC'}
                </button>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
