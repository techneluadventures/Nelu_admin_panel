'use client';
import { useState } from 'react';
import { api } from '../lib/api';

const DOC_TYPES = [
  { value: 'aadhaar', label: 'Aadhaar Card' },
  { value: 'pan', label: 'PAN Card' },
  { value: '10th_marksheet', label: '10th Marksheet' },
  { value: '12th_marksheet', label: '12th Marksheet' },
  { value: 'degree_certificate', label: 'Degree Certificate' },
  { value: 'experience_letter', label: 'Experience Letter (Previous Employer)' },
  { value: 'offer_letter_previous', label: 'Previous Offer Letter' },
  { value: 'bank_passbook', label: 'Bank Passbook / Cancelled Cheque' },
  { value: 'passport_photo', label: 'Passport Photo' },
  { value: 'other', label: 'Other Document' },
];

// Converts File to base64 string
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function DocumentUpload({ candidateId, onUploaded }) {
  const [type, setType] = useState('aadhaar');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;
    setUploading(true); setError(''); setSuccess('');
    try {
      const fileBase64 = await toBase64(file);
      await api.documents.upload({ candidate_id: candidateId, file_type: type, filename: file.name, fileBase64 });
      setSuccess('Document uploaded successfully!');
      setFile(null);
      if (onUploaded) onUploaded();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleUpload} className="space-y-3">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Document type</label>
        <select value={type} onChange={e => setType(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
          {DOC_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">File (PDF, JPG, PNG)</label>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png"
          onChange={e => setFile(e.target.files[0])}
          className="w-full text-sm text-gray-600" />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {success && <p className="text-xs text-green-600">{success}</p>}
      <button type="submit" disabled={uploading || !file}
        className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
        {uploading ? 'Uploading...' : 'Upload document'}
      </button>
    </form>
  );
}
