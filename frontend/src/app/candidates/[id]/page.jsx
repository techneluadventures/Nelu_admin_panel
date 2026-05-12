'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import Navbar from '../../../components/Navbar';
import StatusBadge from '../../../components/StatusBadge';
import Timeline from '../../../components/Timeline';
import AdminDocumentVerification from '../../../components/AdminDocumentVerification';

export default function CandidateDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [c, setC] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  // form states
  const [interviewForm, setInterviewForm] = useState({ interview_at: '', interview_mode: 'online', interview_link: '', interview_location: '' });
  const [offerForm, setOfferForm] = useState({ ctc: '', joining_date: '', probation_months: 3, offer_deadline: '' });
  const [trialForm, setTrialForm] = useState({ trial_start: '', trial_end: '' });
  const [extendForm, setExtendForm] = useState({ newEndDate: '', extensionMonths: 1, reason: '' });
  const [resignForm, setResignForm] = useState({ resignation_date: '', last_working_day: '', reason: '' });
  const [termForm, setTermForm] = useState({ last_working_day: '', reason: '' });
  const [activePanel, setActivePanel] = useState(null);

  async function load() {
    try {
      const data = await api.candidates.get(id);
      setC(data);
    } catch { router.push('/candidates'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [id]);

  async function action(fn, successMsg) {
    setBusy(true); setMsg(''); setErr('');
    try {
      await fn();
      setMsg(successMsg);
      setActivePanel(null);
      await load();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  if (loading) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="p-8 text-gray-400">Loading...</div></div>;
  if (!c) return null;

  const st = c.status;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6 space-y-4">

        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-lg font-semibold text-gray-900">{c.full_name}</h1>
                {c.employee_id && <span className="text-sm text-gray-400 font-mono bg-gray-100 px-2 py-0.5 rounded">{c.employee_id}</span>}
              </div>
              <p className="text-sm text-gray-500">{c.email} · {c.phone}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Role: {c.roles?.role_name} ({c.roles?.type}) · Applied: {new Date(c.created_at).toLocaleDateString('en-IN')}
              </p>
              {c.ctc && <p className="text-xs text-gray-400">CTC: {c.ctc} · Joining: {c.joining_date}</p>}
              {c.trial_start && <p className="text-xs text-gray-400">Trial: {c.trial_start} → {c.trial_end}</p>}
            </div>
            <StatusBadge status={st} />
          </div>

          {/* Feedback messages */}
          {msg && <div className="mt-3 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">{msg}</div>}
          {err && <div className="mt-3 text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg">{err}</div>}

          {/* ACTION BUTTONS — shown based on current status */}
          <div className="mt-4 flex gap-2 flex-wrap">

            {/* SHORTLIST — schedule interview */}
            {st === 'applied' && (
              <button onClick={() => setActivePanel(activePanel === 'interview' ? null : 'interview')}
                className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-violet-700">
                Shortlist & Schedule Interview
              </button>
            )}
            {st === 'applied' && (
              <button onClick={() => action(() => api.candidates.status(id, 'rejected'), 'Candidate rejected. Rejection email sent.')}
                disabled={busy} className="border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50">
                Reject
              </button>
            )}

            {/* MARK INTERVIEW DONE */}
            {st === 'interview_scheduled' && (
              <button onClick={() => action(() => api.candidates.status(id, 'interview_done'), 'Interview marked as done.')}
                disabled={busy} className="bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-cyan-700 disabled:opacity-50">
                Mark Interview Done
              </button>
            )}

            {/* SELECT or REJECT after interview */}
            {st === 'interview_done' && (
              <>
                <button onClick={() => action(() => api.candidates.status(id, 'selected'), 'Candidate selected!')}
                  disabled={busy} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-teal-700 disabled:opacity-50">
                  Select Candidate
                </button>
                <button onClick={() => action(() => api.candidates.status(id, 'rejected'), 'Candidate rejected.')}
                  disabled={busy} className="border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50">
                  Reject
                </button>
              </>
            )}

            {/* SEND OFFER */}
            {st === 'selected' && (
              <button onClick={() => setActivePanel(activePanel === 'offer' ? null : 'offer')}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700">
                Send Offer Letter
              </button>
            )}

            {/* START TRIAL (after offer accepted + docs collected) */}
            {st === 'offer_accepted' && (
              <button onClick={() => setActivePanel(activePanel === 'trial' ? null : 'trial')}
                className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-700">
                Mark as Pre-Boarding
              </button>
            )}

            {st === 'pre_boarding' && (
              <button onClick={() => setActivePanel(activePanel === 'trial' ? null : 'trial')}
                className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-700">
                Start Trial Period (Joining Day)
              </button>
            )}

            {/* AFTER TRIAL: Confirm / Extend / Terminate */}
            {(st === 'trial' || st === 'probation_extended') && (
              <>
                <button onClick={() => action(() => api.candidates.status(id, 'docs_pending'), 'Document collection started.')}
                  disabled={busy} className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-700 disabled:opacity-50">
                  Move to Docs Collection
                </button>
                <button onClick={() => setActivePanel(activePanel === 'extend' ? null : 'extend')}
                  className="border border-orange-300 text-orange-700 px-4 py-2 rounded-lg text-sm hover:bg-orange-50">
                  Extend Probation
                </button>
                <button onClick={() => setActivePanel(activePanel === 'terminate' ? null : 'terminate')}
                  className="border border-red-300 text-red-700 px-4 py-2 rounded-lg text-sm hover:bg-red-50">
                  Terminate (Trial)
                </button>
              </>
            )}

            {/* VERIFY DOCS — already on docs page, but remind here */}
            {st === 'docs_submitted' && (
              <p className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                Documents submitted — scroll down to verify each document.
              </p>
            )}

            {/* CONFIRM EMPLOYMENT */}
            {st === 'docs_verified' && (
              <button onClick={() => action(() => api.candidates.confirm(id), 'Employment confirmed! Confirmation letter sent.')}
                disabled={busy} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
                Confirm Employment
              </button>
            )}

            {/* ACTIVE EMPLOYEE — resign / terminate */}
            {st === 'active' && (
              <>
                <button onClick={() => setActivePanel(activePanel === 'resign' ? null : 'resign')}
                  className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                  Process Resignation
                </button>
                <button onClick={() => setActivePanel(activePanel === 'terminate' ? null : 'terminate')}
                  className="border border-red-300 text-red-700 px-4 py-2 rounded-lg text-sm hover:bg-red-50">
                  Terminate Employment
                </button>
              </>
            )}

            {/* COMPLETE OFFBOARDING */}
            {(st === 'resigned' || st === 'terminated') && (
              <button onClick={() => action(() => api.candidates.offboard(id), 'Offboarding complete. Relieving and experience letters sent.')}
                disabled={busy} className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50">
                Complete Offboarding (Send Relieving Letter)
              </button>
            )}
          </div>

          {/* ── INLINE PANELS ─────────────────────────────── */}

          {/* Interview scheduling panel */}
          {activePanel === 'interview' && (
            <div className="mt-4 p-4 bg-violet-50 rounded-xl border border-violet-200 space-y-3">
              <h3 className="text-sm font-medium text-violet-800">Schedule Interview</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Date & Time *</label>
                  <input type="datetime-local" value={interviewForm.interview_at}
                    onChange={e => setInterviewForm(p => ({ ...p, interview_at: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Mode *</label>
                  <select value={interviewForm.interview_mode}
                    onChange={e => setInterviewForm(p => ({ ...p, interview_mode: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900">
                    <option value="online">Online (Video Call)</option>
                    <option value="offline">Offline (In-Person)</option>
                    <option value="phone">Phone Call</option>
                  </select>
                </div>
                {interviewForm.interview_mode === 'online' ? (
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Meeting Link</label>
                    <input value={interviewForm.interview_link}
                      onChange={e => setInterviewForm(p => ({ ...p, interview_link: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                      placeholder="https://meet.google.com/..." />
                  </div>
                ) : (
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Venue Address</label>
                    <input value={interviewForm.interview_location}
                      onChange={e => setInterviewForm(p => ({ ...p, interview_location: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                      placeholder="Office address or venue" />
                  </div>
                )}
              </div>
              <button onClick={() => action(() => api.candidates.shortlist(id, interviewForm), 'Shortlisted! Interview invitation email sent.')}
                disabled={busy} className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
                {busy ? 'Sending...' : 'Confirm & Send Interview Invitation'}
              </button>
            </div>
          )}

          {/* Offer letter panel */}
          {activePanel === 'offer' && (
            <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-200 space-y-3">
              <h3 className="text-sm font-medium text-purple-800">Send Offer Letter</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">CTC / Stipend *</label>
                  <input value={offerForm.ctc} onChange={e => setOfferForm(p => ({ ...p, ctc: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                    placeholder="₹4,00,000 per annum" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Joining Date *</label>
                  <input type="date" value={offerForm.joining_date}
                    onChange={e => setOfferForm(p => ({ ...p, joining_date: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Trial Period (months)</label>
                  <select value={offerForm.probation_months}
                    onChange={e => setOfferForm(p => ({ ...p, probation_months: parseInt(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <option value={1}>1 month</option>
                    <option value={2}>2 months</option>
                    <option value={3}>3 months</option>
                    <option value={6}>6 months</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Offer Deadline *</label>
                  <input type="date" value={offerForm.offer_deadline}
                    onChange={e => setOfferForm(p => ({ ...p, offer_deadline: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <button onClick={() => action(() => api.candidates.sendOffer(id, offerForm), 'Offer letter generated and emailed!')}
                disabled={busy} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
                {busy ? 'Generating...' : 'Generate PDF & Send Offer Letter'}
              </button>
            </div>
          )}

          {/* Trial start panel */}
          {activePanel === 'trial' && (
            <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
              <h3 className="text-sm font-medium text-amber-800">
                {st === 'offer_accepted' ? 'Set Pre-Boarding' : 'Start Trial Period'}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Trial Start Date</label>
                  <input type="date" value={trialForm.trial_start}
                    onChange={e => setTrialForm(p => ({ ...p, trial_start: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Trial End Date</label>
                  <input type="date" value={trialForm.trial_end}
                    onChange={e => setTrialForm(p => ({ ...p, trial_end: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900" />
                </div>
              </div>
              <button
                onClick={() => {
                  const fn = st === 'offer_accepted'
                    ? () => api.candidates.status(id, 'pre_boarding')
                    : () => api.candidates.startTrial(id, trialForm);
                  action(fn, st === 'offer_accepted' ? 'Pre-boarding started!' : 'Trial started! Appointment letter sent.');
                }}
                disabled={busy} className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
                {busy ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          )}

          {/* Extend probation panel */}
          {activePanel === 'extend' && (
            <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-200 space-y-3">
              <h3 className="text-sm font-medium text-orange-800">Extend Probation</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">New End Date</label>
                  <input type="date" value={extendForm.newEndDate}
                    onChange={e => setExtendForm(p => ({ ...p, newEndDate: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Extension (months)</label>
                  <select value={extendForm.extensionMonths}
                    onChange={e => setExtendForm(p => ({ ...p, extensionMonths: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <option value={1}>1 month</option>
                    <option value={2}>2 months</option>
                    <option value={3}>3 months</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Reason</label>
                  <input value={extendForm.reason} onChange={e => setExtendForm(p => ({ ...p, reason: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                    placeholder="e.g. Performance targets not fully met" />
                </div>
              </div>
              <button onClick={() => action(() => api.candidates.extend(id, extendForm), 'Probation extended. Extension letter sent.')}
                disabled={busy} className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
                {busy ? 'Processing...' : 'Confirm Extension'}
              </button>
            </div>
          )}

          {/* Resign panel */}
          {activePanel === 'resign' && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Process Resignation</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Resignation Date</label>
                  <input type="date" value={resignForm.resignation_date}
                    onChange={e => setResignForm(p => ({ ...p, resignation_date: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Last Working Day</label>
                  <input type="date" value={resignForm.last_working_day}
                    onChange={e => setResignForm(p => ({ ...p, last_working_day: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Reason (optional)</label>
                  <input value={resignForm.reason} onChange={e => setResignForm(p => ({ ...p, reason: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                    placeholder="Better opportunity, personal reasons, etc." />
                </div>
              </div>
              <button onClick={() => action(() => api.candidates.resign(id, resignForm), 'Resignation accepted. Email sent.')}
                disabled={busy} className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
                {busy ? 'Processing...' : 'Accept Resignation'}
              </button>
            </div>
          )}

          {/* Terminate panel */}
          {activePanel === 'terminate' && (
            <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200 space-y-3">
              <h3 className="text-sm font-medium text-red-800">Terminate Employment</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Last Working Day</label>
                  <input type="date" value={termForm.last_working_day}
                    onChange={e => setTermForm(p => ({ ...p, last_working_day: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Reason *</label>
                  <input value={termForm.reason} onChange={e => setTermForm(p => ({ ...p, reason: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                    placeholder="Performance issues, misconduct, etc." />
                </div>
              </div>
              <button onClick={() => {
                const fn = (st === 'trial' || st === 'probation_extended')
                  ? () => api.candidates.status(id, 'trial_terminated', { last_working_day: termForm.last_working_day, exit_reason: termForm.reason })
                  : () => api.candidates.terminate(id, termForm);
                action(fn, 'Termination processed. Letter sent.');
              }} disabled={busy} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
                {busy ? 'Processing...' : 'Confirm Termination'}
              </button>
            </div>
          )}
        </div>

        {/* Document Checklist & Verification */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Onboarding Compliance Checklist</h2>
          <AdminDocumentVerification candidateId={id} onAction={() => { load(); }} />
        </div>

        {/* System Access Panel (for active/trial employees) */}
        {['trial', 'probation_extended', 'docs_pending', 'docs_submitted', 'docs_verified', 'confirmed', 'active'].includes(st) && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900 mb-1">Corporate System Access</h2>
                <p className="text-xs text-gray-500">Manage official credentials and portal access for this employee.</p>
              </div>
              <button 
                onClick={() => {
                  if (confirm('This will re-sync the employee account with Supabase and RE-SEND the credentials email to their personal address. Continue?')) {
                    action(() => api.candidates.provision(id), 'Account re-provisioned and credentials email sent.');
                  }
                }}
                disabled={busy}
                className="px-3 py-1.5 border border-blue-200 text-blue-600 text-xs font-semibold rounded-lg hover:bg-blue-50 transition-colors"
              >
                {busy ? 'Processing...' : 'Re-provision Account & Send Credentials'}
              </button>
            </div>
          </div>
        )}

        {/* Issued Letters */}
        {c.issued_letters?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-medium text-gray-700 mb-3">Issued Letters</h2>
            <div className="space-y-2">
              {c.issued_letters.map(l => (
                <div key={l.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-800 capitalize">{l.type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-400">{new Date(l.issued_at).toLocaleDateString('en-IN')}</p>
                  </div>
                  {l.pdf_url && (
                    <a href={l.pdf_url} target="_blank" rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline">
                      Download PDF →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Timeline</h2>
          <Timeline events={c.workflow_events || []} />
        </div>

        {/* Email history */}
        {c.email_logs?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-medium text-gray-700 mb-3">Emails sent</h2>
            <div className="space-y-1.5">
              {c.email_logs.map(e => (
                <div key={e.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700">{e.subject}</span>
                  <span className="text-gray-400">{new Date(e.sent_at).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
