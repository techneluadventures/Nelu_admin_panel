// ============================================================
// NELU — Complete Status Machine
// The ONLY place in the entire codebase that knows about
// valid status transitions. Nothing else decides this.
// ============================================================

// Every valid transition: what status can follow what
const TRANSITIONS = {
  applied:             ['shortlisted', 'interview_scheduled', 'rejected'],
  shortlisted:         ['interview_scheduled', 'rejected'],
  interview_scheduled: ['interview_done'],
  interview_done:      ['selected', 'rejected'],
  selected:            ['offer_sent'],
  offer_sent:          ['offer_accepted', 'offer_declined'],
  offer_accepted:      ['pre_boarding'],
  pre_boarding:        ['trial'],
  trial:               ['docs_pending', 'probation_extended', 'trial_terminated'],
  probation_extended:  ['docs_pending', 'trial_terminated'],
  docs_pending:        ['docs_submitted'],
  docs_submitted:      ['docs_verified', 'docs_pending'], // docs_pending = re-upload requested
  docs_verified:       ['confirmed'],
  confirmed:           ['active'],
  active:              ['resigned', 'terminated'],
  resigned:            ['offboarded'],
  terminated:          ['offboarded'],
};

// Human-readable labels for each status (shown on dashboard)
export const STATUS_LABELS = {
  applied:             'Applied',
  shortlisted:         'Shortlisted',
  interview_scheduled: 'Interview Scheduled',
  interview_done:      'Interview Done',
  selected:            'Selected',
  rejected:            'Rejected',
  offer_sent:          'Offer Sent',
  offer_accepted:      'Offer Accepted',
  offer_declined:      'Offer Declined',
  pre_boarding:        'Pre-Boarding',
  trial:               'Trial Period',
  probation_extended:  'Probation Extended',
  trial_terminated:    'Trial Terminated',
  docs_pending:        'Docs Pending',
  docs_submitted:      'Docs Submitted',
  docs_verified:       'Docs Verified',
  confirmed:           'Confirmed',
  active:              'Active Employee',
  resigned:            'Resigned',
  terminated:          'Terminated',
  offboarded:          'Offboarded',
};

// What email + PDF fires when we reach each status
// Used by workflowService to know what to do automatically
export const STATUS_ACTIONS = {
  applied:             { email: 'acknowledgement',           pdf: null },
  shortlisted:         { email: 'interview_invitation',      pdf: null },
  rejected:            { email: 'rejection',                 pdf: null },
  offer_sent:          { email: 'offer_letter',              pdf: 'offer_letter' },
  offer_accepted:      { email: 'offer_acceptance_confirm',  pdf: null },
  offer_declined:      { email: 'offer_declined_notify_hr',  pdf: null },
  pre_boarding:        { email: 'document_collection',       pdf: null },
  trial:               { email: 'trial_welcome',             pdf: 'appointment_letter' },
  probation_extended:  { email: 'probation_extension',       pdf: 'trial_extension_letter' },
  trial_terminated:    { email: 'trial_termination',         pdf: 'termination_letter' },
  docs_pending:        { email: 'docs_reminder',             pdf: null },
  docs_verified:       { email: 'docs_verified_notify',      pdf: null },
  confirmed:           { email: 'confirmation',              pdf: 'confirmation_letter' },
  resigned:            { email: 'resignation_accepted',      pdf: 'resignation_acceptance_letter' },
  terminated:          { email: 'termination_notify',        pdf: 'termination_letter' },
  offboarded:          { email: 'offboarding_complete',      pdf: 'relieving_letter' },
};

// Returns true/false — safe check without throwing
export function canTransition(from, to) {
  return (TRANSITIONS[from] || []).includes(to);
}

// Throws a 422 error if the transition is not allowed
export function assertTransition(from, to) {
  if (!canTransition(from, to)) {
    const err = new Error(`Invalid status transition: ${from} → ${to}`);
    err.code = 'INVALID_TRANSITION';
    err.statusCode = 422;
    throw err;
  }
}

// Returns all valid next statuses from the current one
export function nextStatuses(current) {
  return TRANSITIONS[current] || [];
}

// Returns the "main" next status (first in list, used for one-click advance)
export function primaryNext(current) {
  return (TRANSITIONS[current] || [])[0] || null;
}
