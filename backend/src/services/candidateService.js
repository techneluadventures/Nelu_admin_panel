// ============================================================
// NELU — Candidate Service
// All database operations for the candidate lifecycle.
// ============================================================
import { supabase }          from '../config/supabase.js';
import { assertTransition }  from '../utils/statusMachine.js';
import { auditLog }          from './auditService.js';
import { workflowBus }       from './workflowService.js';

// ─── Fetch candidate with all relations ─────────────────────
async function fetchFull(id) {
  const { data, error } = await supabase
    .from('candidates')
    .select('*, roles(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// ─── Generate employee ID ────────────────────────────────────
async function generateEmployeeId() {
  const { data } = await supabase.rpc('generate_employee_id');
  return data;
}

// ============================================================
// LIST candidates with filters
// ============================================================
export async function listCandidates({ status, role_id, search, limit = 50, offset = 0 } = {}) {
  let query = supabase
    .from('candidates')
    .select('*, roles(role_name, department, type)')
    .range(Number(offset), Number(offset) + Number(limit) - 1)
    .order('created_at', { ascending: false });

  if (status)  query = query.eq('status', status);
  if (role_id) query = query.eq('role_id', role_id);
  if (search)  query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ============================================================
// GET one candidate (full detail)
// ============================================================
export async function getCandidate(id) {
  const { data, error } = await supabase
    .from('candidates')
    .select(`
      *,
      roles(*),
      documents(*),
      issued_letters(*),
      workflow_events(*, users(name)),
      email_logs(*)
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
// GET by unique token (candidate portal)
// ============================================================
export async function getCandidateByToken(token) {
  const { data, error } = await supabase
    .from('candidates')
    .select('*, roles(role_name, department, type), issued_letters(*), documents(*)')
    .eq('unique_token', token)
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
// CREATE candidate (from form submission)
// ============================================================
export async function createCandidate(payload, actorId) {
  const { data, error } = await supabase
    .from('candidates')
    .insert({ ...payload, status: 'applied' })
    .select('*, roles(*)')
    .single();

  if (error) throw error;
  await auditLog(actorId, 'candidate.created', 'candidates', data.id);
  workflowBus.emit('candidate.applied', data);
  return data;
}

// ============================================================
// ADVANCE STATUS — the main state machine trigger
// ============================================================
export async function advanceStatus(candidateId, toStatus, actorId, extraData = {}) {
  // Fetch current status
  const current = await fetchFull(candidateId);
  assertTransition(current.status, toStatus);

  // Build update payload
  const updatePayload = { status: toStatus, ...extraData };

  // Auto-assign employee ID when going to trial
  if (toStatus === 'trial' && !current.employee_id) {
    updatePayload.employee_id = await generateEmployeeId();
  }

  // Update in database
  const { data, error } = await supabase
    .from('candidates')
    .update(updatePayload)
    .eq('id', candidateId)
    .select('*, roles(*)')
    .single();

  if (error) throw error;

  // Record in workflow events
  await supabase.from('workflow_events').insert({
    candidate_id: candidateId,
    event_type:   'status_change',
    from_status:  current.status,
    to_status:    toStatus,
    actor_id:   actorId,
  });

  // Audit log
  await auditLog(actorId, `candidate.${toStatus}`, 'candidates', candidateId, { from: current.status });

  // Fire the workflow event — triggers emails and PDFs automatically
  const enriched = { ...data, _extensionData: extraData._extensionData };
  workflowBus.emit(`candidate.${toStatus}`, enriched);

  return data;
}

// ============================================================
// SHORTLIST — moves to interview_scheduled
// Sets interview details at the same time
// ============================================================
export async function shortlistCandidate(candidateId, interviewData, actorId) {
  return advanceStatus(candidateId, 'interview_scheduled', actorId, {
    interview_at:       interviewData.interview_at,
    interview_mode:     interviewData.interview_mode,
    interview_link:     interviewData.interview_link,
    interview_location: interviewData.interview_location,
  });
}

// ============================================================
// SEND OFFER — moves to offer_sent
// Sets CTC, joining date, probation period
// ============================================================
export async function sendOffer(candidateId, offerData, actorId) {
  return advanceStatus(candidateId, 'offer_sent', actorId, {
    ctc:              offerData.ctc,
    joining_date:     offerData.joining_date,
    probation_months: offerData.probation_months || 3,
    offer_deadline:   offerData.offer_deadline,
  });
}

// ============================================================
// START TRIAL — moves to trial
// Sets trial start and end dates
// ============================================================
export async function startTrial(candidateId, trialData, actorId) {
  return advanceStatus(candidateId, 'trial', actorId, {
    trial_start: trialData.trial_start,
    trial_end:   trialData.trial_end,
  });
}

// ============================================================
// EXTEND PROBATION
// ============================================================
export async function extendProbation(candidateId, extensionData, actorId) {
  return advanceStatus(candidateId, 'probation_extended', actorId, {
    trial_end:          extensionData.newEndDate,
    _extensionData:     extensionData,
  });
}

// ============================================================
// INITIATE RESIGNATION
// ============================================================
export async function initiateResignation(candidateId, resignData, actorId) {
  return advanceStatus(candidateId, 'resigned', actorId, {
    resignation_date: resignData.resignation_date,
    last_working_day: resignData.last_working_day,
    exit_type:        'resignation',
    exit_reason:      resignData.reason || 'Resignation',
  });
}

// ============================================================
// INITIATE TERMINATION
// ============================================================
export async function initiateTermination(candidateId, termData, actorId) {
  return advanceStatus(candidateId, 'terminated', actorId, {
    last_working_day: termData.last_working_day,
    exit_type:        'termination',
    exit_reason:      termData.reason,
  });
}

// ============================================================
// COMPLETE OFFBOARDING
// ============================================================
export async function completeOffboarding(candidateId, actorId) {
  return advanceStatus(candidateId, 'offboarded', actorId);
}

// ============================================================
// DASHBOARD STATS
// ============================================================
export async function getDashboardStats() {
  const { data, error } = await supabase
    .from('candidates')
    .select('status');
  if (error) throw error;

  const stats = {};
  for (const row of data) {
    stats[row.status] = (stats[row.status] || 0) + 1;
  }
  return stats;
}
