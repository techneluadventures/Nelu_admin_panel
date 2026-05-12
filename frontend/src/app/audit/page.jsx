'use client';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import Navbar from '../../components/Navbar';

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [errors, setErrors] = useState([]);
  const [tab, setTab] = useState('logs');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.audit.logs(), api.audit.errors()])
      .then(([l, e]) => { setLogs(l); setErrors(e); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="p-8 text-gray-400">Loading...</div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">Audit & Logs</h1>

        <div className="flex gap-3 mb-4">
          {['logs', 'errors'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm capitalize ${tab === t ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
              {t === 'logs' ? `Audit logs (${logs.length})` : `Failed jobs (${errors.length})`}
            </button>
          ))}
        </div>

        {tab === 'logs' && (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {logs.map(l => (
              <div key={l.id} className="px-4 py-3 flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800 font-mono">{l.action}</p>
                  <p className="text-xs text-gray-400">{l.entity_type} · {l.entity_id?.substring(0, 8)} · by {l.users?.name || 'system'}</p>
                </div>
                <span className="text-xs text-gray-400">{new Date(l.timestamp).toLocaleString('en-IN')}</span>
              </div>
            ))}
            {logs.length === 0 && <p className="px-4 py-8 text-sm text-gray-400 text-center">No audit logs yet.</p>}
          </div>
        )}

        {tab === 'errors' && (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {errors.map(e => (
              <div key={e.id} className="px-4 py-4 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-red-700">{e.service}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${e.status === 'dead' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{e.status}</span>
                  </div>
                  <p className="text-xs text-gray-500 max-w-lg">{e.message}</p>
                  <p className="text-xs text-gray-400 mt-2 font-mono">
                    Entity: {e.entity_id || 'N/A'} · Attempts: {e.retry_count} · {new Date(e.timestamp).toLocaleString('en-IN')}
                  </p>
                </div>
                {e.status === 'dead' && (
                  <button 
                    onClick={async (btn) => {
                      try {
                        btn.target.disabled = true;
                        btn.target.innerText = 'Retrying...';
                        await api.audit.retry(e.id);
                        alert('Retry triggered successfully!');
                        // Refresh
                        const errs = await api.audit.errors();
                        setErrors(errs);
                      } catch (err) {
                        alert('Retry failed: ' + err.message);
                        btn.target.disabled = false;
                        btn.target.innerText = 'Try Again';
                      }
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    Try Again
                  </button>
                )}
              </div>
            ))}
            {errors.length === 0 && <p className="px-4 py-8 text-sm text-green-600 text-center font-medium">No failed jobs. Everything is running smoothly!</p>}
          </div>
        )}

      </div>
    </div>
  );
}
