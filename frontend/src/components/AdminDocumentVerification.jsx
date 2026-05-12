'use client';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import StatusBadge from './StatusBadge';

export default function AdminDocumentVerification({ candidateId, onAction }) {
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const data = await api.documents.checklist(candidateId);
      setChecklist(data);
    } catch (err) {
      setError('Failed to load document checklist');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [candidateId]);

  async function handleVerify(docId, status) {
    let reason = null;
    if (status === 'rejected') {
      reason = prompt('Enter rejection reason:');
      if (!reason) return;
    }

    setBusy(true);
    try {
      await api.documents.verify(docId, status, reason);
      await load();
      if (onAction) onAction();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="p-4 text-gray-400 text-sm">Loading documents...</div>;

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      
      <div className="grid gap-2">
        {checklist.map((item) => (
          <div key={item.type} className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 capitalize">{item.label}</h3>
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge status={item.status} />
                {item.document && (
                  <a href={item.document.file_url} target="_blank" rel="noreferrer" 
                    className="text-xs text-blue-600 hover:underline">
                    View Document →
                  </a>
                )}
              </div>
              {item.rejection_reason && (
                <p className="text-[10px] text-red-600 mt-1 italic">Reason: {item.rejection_reason}</p>
              )}
            </div>

            <div className="flex gap-2">
              {item.document && item.status === 'pending' && (
                <>
                  <button 
                    onClick={() => handleVerify(item.document.id, 'verified')}
                    disabled={busy}
                    className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50">
                    Verify
                  </button>
                  <button 
                    onClick={() => handleVerify(item.document.id, 'rejected')}
                    disabled={busy}
                    className="bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-100 disabled:opacity-50">
                    Reject
                  </button>
                </>
              )}
              {item.status === 'missing' && (
                <span className="text-[10px] text-gray-400 font-mono italic">Waiting for upload</span>
              )}
              {item.status === 'verified' && (
                <span className="text-green-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
              {item.status === 'rejected' && (
                 <button 
                 onClick={() => handleVerify(item.document.id, 'verified')}
                 disabled={busy}
                 className="text-[10px] text-blue-600 hover:underline">
                 Override to Verify
               </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
