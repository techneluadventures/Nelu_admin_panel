'use client';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function DocumentChecklist({ candidateId, onStatusChange }) {
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    try {
      const data = await api.documents.checklist(candidateId);
      setChecklist(data);
    } catch (err) {
      setError('Failed to load checklist');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [candidateId]);

  const verifiedCount = checklist.filter(i => i.status === 'verified').length;
  const totalCount = checklist.length;
  const progress = totalCount > 0 ? (verifiedCount / totalCount) * 100 : 0;
  const isComplete = verifiedCount === totalCount;

  async function handleFileUpload(e, type) {
    const file = e.target.files[0];
    if (!file) return;

    // Size check (10MB = 10 * 1024 * 1024 bytes)
    if (file.size > 10 * 1024 * 1024) {
      setError(`File "${file.name}" is too large. Max size is 10MB.`);
      return;
    }

    setUploadingType(type);
    setError('');

    try {
      const fileBase64 = await toBase64(file);
      await api.documents.upload({
        candidate_id: candidateId,
        file_type: type,
        filename: file.name,
        fileBase64
      });
      await load(); // Refresh checklist
      if (onStatusChange) onStatusChange();
    } catch (err) {
      setError(`Upload failed for ${type}: ${err.message}`);
    } finally {
      setUploadingType(null);
    }
  }

  if (loading) return <div className="animate-pulse space-y-3">
    {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
  </div>;

  return (
    <div className="space-y-6">
      {/* Progress Section */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Verification Progress</span>
          <span className="text-sm font-bold text-gray-900">{verifiedCount} / {totalCount} Verified</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-[#014905] h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>
        {isComplete ? (
          <p className="text-[11px] text-green-700 mt-2 font-medium flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            All documents verified. You are ready for confirmation!
          </p>
        ) : (
          <p className="text-[11px] text-gray-500 mt-2 italic">
            Please upload all missing or rejected documents to proceed with your employment confirmation.
          </p>
        )}
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}
      
      <div className="grid gap-3">
        {checklist.map((item) => (
          <div key={item.type} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900">{item.label}</h3>
                {item.status === 'verified' && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">Verified</span>}
                {item.status === 'pending' && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold uppercase">Pending Verification</span>}
                {item.status === 'rejected' && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold uppercase">Rejected</span>}
                {item.status === 'missing' && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold uppercase">Missing</span>}
              </div>
              
              {item.status === 'rejected' && item.rejection_reason && (
                <p className="text-xs text-red-600 mt-1 italic">Reason: {item.rejection_reason}</p>
              )}
              
              {item.document && (
                <p className="text-[10px] text-gray-400 mt-1">
                  Last upload: {new Date(item.document.uploaded_at).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {item.status === 'verified' ? (
                <div className="text-green-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              ) : (
                <label className={`relative cursor-pointer bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-xs font-medium text-gray-700 transition-colors ${uploadingType === item.type ? 'opacity-50 pointer-events-none' : ''}`}>
                  <span>{item.status === 'missing' ? 'Upload' : 'Re-upload'}</span>
                  <input type="file" className="sr-only" onChange={(e) => handleFileUpload(e, item.type)} accept=".pdf,.jpg,.jpeg,.png" />
                  {uploadingType === item.type && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
                      <div className="w-3 h-3 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </label>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <h4 className="text-xs font-bold text-blue-900 mb-1">Upload Requirements:</h4>
        <ul className="text-[10px] text-blue-800 list-disc list-inside space-y-1">
          <li><strong>Formats:</strong> PDF, JPG, or PNG only.</li>
          <li><strong>Size:</strong> Maximum 10MB per file.</li>
          <li><strong>Clarity:</strong> Ensure text is readable and edges are not cut off.</li>
        </ul>
      </div>
    </div>
  );
}
