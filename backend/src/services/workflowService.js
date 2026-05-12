// ============================================================
// NELU — Workflow Service (The Brain)
// This is the orchestrator. When a candidate's status changes,
// this file decides what email to send, what PDF to generate,
// and what HR alerts to fire — all automatically.
// ============================================================
import { EventEmitter } from 'events';
import { withRetry } from '../utils/withRetry.js';
import { STATUS_ACTIONS } from '../utils/statusMachine.js';
import * as email from './emailService.js';
import * as pdf from './pdfService.js';
import * as users from './userService.js';

export const workflowBus = new EventEmitter();
workflowBus.setMaxListeners(30); // we have many listeners

// ─── Helper to safely run async operations ──────────────────
function safe(fn, service, candidate = null) {
  return withRetry(fn, { 
    service, 
    entityId: candidate?.id, 
    payload: candidate 
  }).catch(err => {
    console.error(`[WORKFLOW] ${service} failed:`, err.message);
  });
}

// ============================================================
// 1. APPLIED → send acknowledgement
// ============================================================
workflowBus.on('candidate.applied', (candidate) => {
  safe(() => email.sendAcknowledgement(candidate), 'email.acknowledgement', candidate);
});

// ============================================================
// 2. SHORTLISTED → send interview invitation
// ============================================================
workflowBus.on('candidate.interview_scheduled', (candidate) => {
  safe(() => email.sendInterviewInvitation(candidate), 'email.interview_invitation');
});

// ============================================================
// 3. REJECTED → send rejection email
// ============================================================
workflowBus.on('candidate.rejected', (candidate) => {
  safe(() => email.sendRejection(candidate), 'email.rejection');
});

// ============================================================
// 4. OFFER_SENT → generate offer letter PDF + email it
// ============================================================
workflowBus.on('candidate.offer_sent', async (candidate) => {
  try {
    const { pdfBuffer } = await withRetry(
      () => pdf.generateOfferLetter(candidate),
      { service: 'pdf.offer_letter', entityId: candidate.id, payload: candidate }
    );
    await withRetry(
      () => email.sendOfferLetter(candidate, pdfBuffer),
      { service: 'email.offer_letter', entityId: candidate.id, payload: candidate }
    );
  } catch (err) {
    console.error('[WORKFLOW] offer_sent flow failed:', err.message);
  }
});

// ============================================================
// 5. OFFER_ACCEPTED → send acceptance confirmation
// ============================================================
workflowBus.on('candidate.offer_accepted', (candidate) => {
  safe(() => email.sendOfferAcceptance(candidate), 'email.offer_acceptance');
  // Alert HR
  safe(() => email.sendHRAlert(
    'Offer Accepted',
    candidate,
    `${candidate.full_name} has accepted the offer for ${candidate.roles?.role_name}.`,
    'Schedule onboarding and prepare joining kit.'
  ), 'email.hr_alert');
});

// ============================================================
// 6. OFFER_DECLINED → alert HR
// ============================================================
workflowBus.on('candidate.offer_declined', (candidate) => {
  safe(() => email.sendHRAlert(
    'Offer Declined',
    candidate,
    `${candidate.full_name} has declined the offer for ${candidate.roles?.role_name}.`,
    'Consider next candidate from the shortlist.'
  ), 'email.hr_alert');
});

// ============================================================
// 7. PRE_BOARDING → send document collection email
// ============================================================
workflowBus.on('candidate.pre_boarding', (candidate) => {
  safe(() => email.sendDocumentCollection(candidate), 'email.document_collection');
});

// ============================================================
// 8. TRIAL → generate appointment letter + send welcome email
// ============================================================
workflowBus.on('candidate.trial', async (candidate) => {
  try {
    // 1. Generate Letter
    const { pdfBuffer } = await withRetry(
      () => pdf.generateAppointmentLetter(candidate),
      { service: 'pdf.appointment_letter', entityId: candidate.id, payload: candidate }
    );
    
    // 2. Send Welcome Email (Letter attached)
    await withRetry(
      () => email.sendTrialWelcome(candidate, pdfBuffer),
      { service: 'email.trial_welcome', entityId: candidate.id, payload: candidate }
    );

    // 3. Provision Employee Account (Credentials email)
    await withRetry(
      () => users.provisionEmployeeAccount(candidate),
      { service: 'users.provision' }
    );
  } catch (err) {
    console.error('[WORKFLOW] trial flow failed:', err.message);
  }
});

// ============================================================
// 9. PROBATION_EXTENDED → generate extension letter + email
// ============================================================
workflowBus.on('candidate.probation_extended', async (candidate) => {
  const extensionData = candidate._extensionData || {};
  try {
    const { pdfBuffer } = await withRetry(
      () => pdf.generateExtensionLetter(candidate, extensionData),
      { service: 'pdf.extension_letter' }
    );
    await withRetry(
      () => email.sendProbationExtension(candidate, extensionData),
      { service: 'email.probation_extension' }
    );
  } catch (err) {
    console.error('[WORKFLOW] probation_extended flow failed:', err.message);
  }
});

// ============================================================
// 10. TRIAL_TERMINATED → generate termination letter + email
// ============================================================
workflowBus.on('candidate.trial_terminated', async (candidate) => {
  try {
    const { pdfBuffer } = await withRetry(
      () => pdf.generateTerminationLetter(candidate),
      { service: 'pdf.termination_letter' }
    );
    await withRetry(
      () => email.sendTrialTermination(candidate, pdfBuffer),
      { service: 'email.trial_termination' }
    );
  } catch (err) {
    console.error('[WORKFLOW] trial_terminated flow failed:', err.message);
  }
});

// ============================================================
// 11. DOCS_PENDING → send docs reminder
// ============================================================
workflowBus.on('candidate.docs_pending', (candidate) => {
  safe(() => email.sendDocsReminder(candidate), 'email.docs_reminder');
});

// ============================================================
// 12. DOCS_VERIFIED → alert HR to confirm employment
// ============================================================
workflowBus.on('candidate.docs_verified', (candidate) => {
  safe(() => email.sendHRAlert(
    'Documents Verified',
    candidate,
    `All documents for ${candidate.full_name} have been verified.`,
    'Click Confirm Employment to issue the confirmation letter.'
  ), 'email.hr_alert');
});

// ============================================================
// 13. CONFIRMED → generate confirmation letter + email
// ============================================================
workflowBus.on('candidate.confirmed', async (candidate) => {
  try {
    const { pdfBuffer } = await withRetry(
      () => pdf.generateConfirmationLetter(candidate),
      { service: 'pdf.confirmation_letter', entityId: candidate.id, payload: candidate }
    );
    await withRetry(
      () => email.sendConfirmation(candidate, pdfBuffer),
      { service: 'email.confirmation', entityId: candidate.id, payload: candidate }
    );
  } catch (err) {
    console.error('[WORKFLOW] confirmed flow failed:', err.message);
  }
});

// ============================================================
// 14. RESIGNED → send resignation accepted email
// ============================================================
workflowBus.on('candidate.resigned', (candidate) => {
  safe(() => email.sendResignationAccepted(candidate), 'email.resignation_accepted');
  safe(() => email.sendHRAlert(
    'Resignation Received',
    candidate,
    `${candidate.full_name} has resigned. Last working day: ${candidate.last_working_day}.`,
    'Initiate exit checklist and schedule exit interview.'
  ), 'email.hr_alert');
});

// ============================================================
// 15. TERMINATED → generate termination letter + email
// ============================================================
workflowBus.on('candidate.terminated', async (candidate) => {
  try {
    const { pdfBuffer } = await withRetry(
      () => pdf.generateTerminationLetter(candidate),
      { service: 'pdf.termination_letter' }
    );
    await withRetry(
      () => email.sendTrialTermination(candidate, pdfBuffer),
      { service: 'email.termination' }
    );
  } catch (err) {
    console.error('[WORKFLOW] terminated flow failed:', err.message);
  }
});

// ============================================================
// 17. RETRY JOB
// ============================================================
export async function retryJob(logId) {
  // 1. Get the failed log
  const { data: log, error } = await supabase
    .from('error_logs')
    .select('*')
    .eq('id', logId)
    .single();

  if (error || !log) throw new Error('Failed job not found');
  if (!log.entity_id) throw new Error('Cannot retry job without entity context');

  // 2. Fetch the latest candidate data
  const { data: candidate, error: cErr } = await supabase
    .from('candidates')
    .select('*, roles(*)')
    .eq('id', log.entity_id)
    .single();

  if (cErr || !candidate) throw new Error('Candidate associated with job not found');

  console.log(`[RETRY] Manual trigger for ${log.service} | Candidate: ${candidate.full_name}`);

  // 3. Map service name to event or function
  // Format matches exactly what we used in the listeners above
  const service = log.service;

  // PDF & EMAIL RETRIES
  if (service.includes('pdf.offer_letter') || service.includes('email.offer_letter')) {
    workflowBus.emit('candidate.offer_sent', candidate);
  } else if (service.includes('pdf.appointment_letter') || service.includes('email.trial_welcome')) {
    workflowBus.emit('candidate.trial', candidate);
  } else if (service.includes('pdf.confirmation_letter') || service.includes('email.confirmation')) {
    workflowBus.emit('candidate.confirmed', candidate);
  } else if (service.includes('email.acknowledgement')) {
    workflowBus.emit('candidate.applied', candidate);
  } else if (service.includes('email.document_collection')) {
    workflowBus.emit('candidate.pre_boarding', candidate);
  } else if (service.includes('users.provision')) {
    await users.provisionEmployeeAccount(candidate);
  } else {
    throw new Error(`Manual retry not supported for service: ${service}`);
  }

  // 4. Mark as resolved if successful
  await supabase.from('error_logs').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', logId);

  return { success: true, service: log.service };
}
