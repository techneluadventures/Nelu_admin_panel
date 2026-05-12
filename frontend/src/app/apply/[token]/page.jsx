// frontend/src/app/apply/[token]/page.jsx
'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { api } from '../../../lib/api';
import DocumentChecklist from '../../../components/DocumentChecklist';
import StatusBadge from '../../../components/StatusBadge';

export default function CandidatePortalPage() {
  const { token } = useParams();
  const searchParams = useSearchParams();
  const action = searchParams.get('action'); // 'accept' or 'decline'

  const [c, setC] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const data = await api.candidates.getByToken(token);
      setC(data);
      // Auto-handle accept/decline from URL param
      if (action === 'accept' && data.status === 'offer_sent') {
        await handleRespond('accept', data);
      } else if (action === 'decline' && data.status === 'offer_sent') {
        await handleRespond('decline', data);
      }
    } catch {
      setError('Invalid or expired link. Please contact HR.');
    } finally { setLoading(false); }
  }

  async function handleRespond(act) {
    setBusy(true);
    try {
      await api.candidates.respond(token, act);
      setMsg(act === 'accept'
        ? 'You have accepted the offer! We will be in touch shortly with joining details.'
        : 'You have declined the offer. Thank you for your time.');
      await load();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  useEffect(() => { load(); }, [token]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Loading your portal...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white border border-red-200 rounded-xl p-8 max-w-sm text-center">
        <p className="text-red-600 text-sm">{error}</p>
        <p className="text-gray-400 text-xs mt-2">Please contact operations.neluadventures@gmail.com</p>
      </div>
    </div>
  );

  const st = c?.status;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto space-y-4">

        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">Candidate Portal</p>
              <h1 className="text-lg font-semibold text-gray-900">{c.full_name}</h1>
              <p className="text-sm text-gray-500">{c.email}</p>
              <p className="text-sm text-gray-500 mt-1">
                Applied for: <strong>{c.roles?.role_name}</strong>
              </p>
              {c.employee_id && <p className="text-xs text-gray-400 mt-1">Employee ID: {c.employee_id}</p>}
            </div>
            <StatusBadge status={st} />
          </div>
          {msg && <div className="mt-3 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">{msg}</div>}
        </div>

        {/* OFFER RESPONSE */}
        {st === 'offer_sent' && (
          <div className="bg-white rounded-xl border border-purple-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-2">You have an offer!</h2>
            <p className="text-sm text-gray-600 mb-1">Position: <strong>{c.roles?.role_name}</strong></p>
            {c.ctc && <p className="text-sm text-gray-600 mb-1">CTC: <strong>{c.ctc}</strong></p>}
            {c.joining_date && <p className="text-sm text-gray-600 mb-1">Joining Date: <strong>{c.joining_date}</strong></p>}
            {c.probation_months && <p className="text-sm text-gray-600 mb-3">Trial Period: <strong>{c.probation_months} months</strong></p>}
            <p className="text-sm text-gray-500 mb-4">Please review your offer letter (check your email) and respond below.</p>
            <div className="flex gap-3">
              <button onClick={() => handleRespond('accept')} disabled={busy}
                className="bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                Accept Offer
              </button>
              <button onClick={() => handleRespond('decline')} disabled={busy}
                className="bg-red-50 text-red-700 border border-red-200 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50">
                Decline Offer
              </button>
            </div>
          </div>
        )}

        {/* DOCUMENT CHECKLIST — Essential for Onboarding Accountability */}
        {['docs_pending', 'pre_boarding', 'docs_submitted', 'trial'].includes(st) && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-1">Onboarding Documents</h2>
            <p className="text-sm text-gray-500 mb-6">
              Complete your verification to confirm your permanent employment status.
            </p>
            <DocumentChecklist candidateId={c.id} onStatusChange={() => { load(); }} />
          </div>
        )}

        {/* STATUS MESSAGES for each stage */}
        {st === 'applied' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-800">
            <p className="font-medium mb-1">Application received!</p>
            <p>Our HR team is reviewing your application. We will get back to you within 5–7 working days.</p>
          </div>
        )}

        {st === 'shortlisted' && (
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-5 text-sm text-violet-800">
            <p className="font-medium mb-1">You've been shortlisted!</p>
            <p>You will receive an interview invitation email shortly with the date, time, and mode of interview.</p>
          </div>
        )}

        {st === 'interview_scheduled' && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 text-sm text-indigo-800">
            <p className="font-medium mb-1">Interview scheduled</p>
            {c.interview_at && <p>Date & Time: <strong>{new Date(c.interview_at).toLocaleString('en-IN')}</strong></p>}
            {c.interview_mode && <p>Mode: <strong className="capitalize">{c.interview_mode}</strong></p>}
            {c.interview_link && <p>Link: <a href={c.interview_link} className="underline">{c.interview_link}</a></p>}
            {c.interview_location && <p>Venue: <strong>{c.interview_location}</strong></p>}
          </div>
        )}

        {st === 'offer_accepted' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-sm text-green-800">
            <p className="font-medium mb-1">Offer accepted — Welcome!</p>
            <p>Joining Date: <strong>{c.joining_date}</strong></p>
            <p className="mt-1">You will receive an email 7 days before joining with the document checklist and portal link.</p>
          </div>
        )}

        {st === 'pre_boarding' && (
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-5 text-sm text-sky-800">
            <p className="font-medium mb-1">Pre-boarding in progress</p>
            <p>Please check your email for the document collection link. Upload all documents before your joining date.</p>
          </div>
        )}

        {st === 'trial' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800">
            <p className="font-medium mb-1">Welcome! Your trial period has started.</p>
            {c.trial_start && <p>Start: <strong>{c.trial_start}</strong></p>}
            {c.trial_end && <p>End: <strong>{c.trial_end}</strong></p>}
            <p className="mt-1">Give your best performance. HR will evaluate at the end of the trial period.</p>
          </div>
        )}

        {st === 'docs_submitted' && (
          <div className="bg-lime-50 border border-lime-200 rounded-xl p-5 text-sm text-lime-800">
            <p className="font-medium mb-1">Documents submitted!</p>
            <p>HR is verifying your documents. This usually takes 1–2 working days. You'll receive an email once verified.</p>
          </div>
        )}

        {st === 'confirmed' || st === 'active' ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-sm text-green-800">
            <p className="font-medium mb-1">Congratulations — you're a confirmed employee!</p>
            <p>Employee ID: <strong>{c.employee_id}</strong></p>
            <p className="mt-1">Your confirmation letter has been sent to your email.</p>
          </div>
        ) : null}

        {st === 'rejected' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-sm text-red-800">
            <p className="font-medium mb-1">Application update</p>
            <p>Thank you for your interest. We regret to inform you that we will not be moving forward at this time. We wish you the best in your career.</p>
          </div>
        )}

        {/* Issued Letters */}
        {c.issued_letters?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-medium text-gray-700 mb-3">Your Documents</h2>
            <div className="space-y-2">
              {c.issued_letters.filter(l => l.pdf_url).map(l => (
                <a key={l.id} href={l.pdf_url} target="_blank" rel="noreferrer"
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-2 rounded">
                  <p className="text-sm text-blue-600 capitalize">{l.type.replace(/_/g, ' ')}</p>
                  <span className="text-xs text-gray-400">Download →</span>
                </a>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400">
          Questions? Contact operations.neluadventures@gmail.com
        </p>
      </div>
    </div>
  );
}
