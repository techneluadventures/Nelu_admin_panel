// ============================================================
// NELU — Complete Email Service
// Handles sending every email in the lifecycle.
// ============================================================
import { transporter }          from '../config/mailer.js';
import { supabase }             from '../config/supabase.js';
import {
  acknowledgementEmail,
  interviewInvitationEmail,
  interviewReminderEmail,
  rejectionEmail,
  offerLetterEmail,
  offerAcceptanceEmail,
  documentCollectionEmail,
  trialWelcomeEmail,
  docsReminderEmail,
  probationExtensionEmail,
  trialTerminationEmail,
  confirmationEmail,
  resignationAcceptedEmail,
  offboardingCompleteEmail,
  hrAlertEmail,
  employeeCredentialsEmail,
} from '../templates/emails/all_templates.js';

const COMPANY     = process.env.COMPANY_NAME     || 'Nelu Adventures';
const HR_EMAIL    = process.env.SMTP_USER;
const FRONTEND_URL = process.env.FRONTEND_URL    || 'http://localhost:3000';

// ─── Core send function ──────────────────────────────────────
async function send(to, subject, html, candidateId = null, type = 'general', attachments = []) {
  // Fill in company name in subject
  const finalSubject = subject.replaceAll('{{company}}', COMPANY);

  await transporter.sendMail({
    from:        `"${COMPANY} HR" <${HR_EMAIL}>`,
    to,
    subject:     finalSubject,
    html,
    attachments, // array of { filename, content (Buffer) }
  });

  // Log every email to database
  if (candidateId) {
    await supabase.from('email_logs').insert({
      candidate_id: candidateId,
      to_email:     to,
      subject:      finalSubject,
      type,
      status:       'sent',
    });
  }
}

// ─── Fill template placeholders ──────────────────────────────
function fill(template, data) {
  let result = typeof template === 'function' ? template(data) : template;
  const allData = { company: COMPANY, ...data };
  for (const [key, value] of Object.entries(allData)) {
    result = result.replaceAll(`{{${key}}}`, value ?? '');
  }
  return result;
}

// ─── Format date nicely ──────────────────────────────────────
function fmt(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
}

// ─── Portal URL for candidate ────────────────────────────────
function portalUrl(token) {
  return `${FRONTEND_URL}/apply/${token}`;
}

// ============================================================
// 1. Application Acknowledgement
// ============================================================
export async function sendAcknowledgement(candidate) {
  const data = {
    full_name:    candidate.full_name,
    role_name:    candidate.roles?.role_name || 'the position',
    ref_id:       candidate.id.substring(0, 8).toUpperCase(),
    applied_date: fmt(candidate.created_at),
  };
  const html = fill(acknowledgementEmail.html, data);
  const subj = fill(acknowledgementEmail.subject, data);
  await send(candidate.email, subj, html, candidate.id, 'acknowledgement');
}

// ============================================================
// 2. Interview Invitation
// ============================================================
export async function sendInterviewInvitation(candidate) {
  const isOnline = candidate.interview_mode === 'online';
  const data = {
    full_name:          candidate.full_name,
    role_name:          candidate.roles?.role_name || 'the position',
    interview_date:     fmt(candidate.interview_at),
    interview_time:     new Date(candidate.interview_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    interview_mode:     candidate.interview_mode?.toUpperCase() || 'Online',
    location_label:     isOnline ? 'Meeting Link' : 'Venue Address',
    interview_location: isOnline ? candidate.interview_link : candidate.interview_location,
    interview_link_section: isOnline
      ? `<p><strong>Meeting Link:</strong> <a href="${candidate.interview_link}">${candidate.interview_link}</a></p>`
      : '',
    portal_url: portalUrl(candidate.unique_token),
  };
  const html = fill(interviewInvitationEmail.html, data);
  const subj = fill(interviewInvitationEmail.subject, data);
  await send(candidate.email, subj, html, candidate.id, 'interview_invitation');
}

// ============================================================
// 3. Interview Reminder (24 hrs before)
// ============================================================
export async function sendInterviewReminder(candidate) {
  const isOnline = candidate.interview_mode === 'online';
  const data = {
    full_name:          candidate.full_name,
    role_name:          candidate.roles?.role_name || 'the position',
    interview_date:     fmt(candidate.interview_at),
    interview_time:     new Date(candidate.interview_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    interview_mode:     candidate.interview_mode?.toUpperCase() || 'Online',
    location_label:     isOnline ? 'Meeting Link' : 'Venue',
    interview_location: isOnline ? candidate.interview_link : candidate.interview_location,
  };
  const html = fill(interviewReminderEmail.html, data);
  const subj = fill(interviewReminderEmail.subject, data);
  await send(candidate.email, subj, html, candidate.id, 'interview_reminder');
}

// ============================================================
// 4. Rejection Email
// ============================================================
export async function sendRejection(candidate) {
  const data = {
    full_name: candidate.full_name,
    role_name: candidate.roles?.role_name || 'the position',
  };
  const html = fill(rejectionEmail.html, data);
  const subj = fill(rejectionEmail.subject, data);
  await send(candidate.email, subj, html, candidate.id, 'rejection');
}

// ============================================================
// 5. Offer Letter Email (with PDF attachment)
// ============================================================
export async function sendOfferLetter(candidate, pdfBuffer) {
  const role = candidate.roles || {};
  const data = {
    full_name:       candidate.full_name,
    role_name:       role.role_name || 'the position',
    department:      role.department || '—',
    employment_type: role.type === 'internship' ? 'Internship' : 'Full-Time',
    ctc:             candidate.ctc || 'As discussed',
    probation_months: candidate.probation_months || 3,
    joining_date:    fmt(candidate.joining_date),
    offer_deadline:  fmt(candidate.offer_deadline),
    accept_url:      `${portalUrl(candidate.unique_token)}?action=accept`,
    decline_url:     `${portalUrl(candidate.unique_token)}?action=decline`,
  };
  const html = fill(offerLetterEmail.html, data);
  const subj = fill(offerLetterEmail.subject, data);
  const attachments = pdfBuffer ? [{ filename: 'Offer_Letter.pdf', content: pdfBuffer }] : [];
  await send(candidate.email, subj, html, candidate.id, 'offer_letter', attachments);
}

// ============================================================
// 6. Offer Acceptance Confirmation
// ============================================================
export async function sendOfferAcceptance(candidate) {
  const data = {
    full_name:      candidate.full_name,
    role_name:      candidate.roles?.role_name || 'the position',
    joining_date:   fmt(candidate.joining_date),
    manager_name:   process.env.DEFAULT_MANAGER_NAME || 'Your Reporting Manager',
    office_address: process.env.OFFICE_ADDRESS || 'Company Office',
    portal_url:     portalUrl(candidate.unique_token),
  };
  const html = fill(offerAcceptanceEmail.html, data);
  const subj = fill(offerAcceptanceEmail.subject, data);
  await send(candidate.email, subj, html, candidate.id, 'offer_acceptance');
}

// ============================================================
// 7. Document Collection (7 days before joining)
// ============================================================
export async function sendDocumentCollection(candidate) {
  const data = {
    full_name:   candidate.full_name,
    joining_date: fmt(candidate.joining_date),
    portal_url:  portalUrl(candidate.unique_token),
  };
  const html = fill(documentCollectionEmail.html, data);
  const subj = fill(documentCollectionEmail.subject, data);
  await send(candidate.email, subj, html, candidate.id, 'document_collection');
}

// ============================================================
// 8. Trial Welcome (on joining day, with appointment letter PDF)
// ============================================================
export async function sendTrialWelcome(candidate, pdfBuffer) {
  const role = candidate.roles || {};
  const data = {
    full_name:       candidate.full_name,
    role_name:       role.role_name || 'the position',
    department:      role.department || '—',
    employee_id:     candidate.employee_id || '—',
    trial_start:     fmt(candidate.trial_start),
    trial_end:       fmt(candidate.trial_end),
    probation_months: candidate.probation_months || 3,
    manager_name:    process.env.DEFAULT_MANAGER_NAME || 'Your Reporting Manager',
  };
  const html = fill(trialWelcomeEmail.html, data);
  const subj = fill(trialWelcomeEmail.subject, data);
  const attachments = pdfBuffer ? [{ filename: 'Appointment_Letter.pdf', content: pdfBuffer }] : [];
  await send(candidate.email, subj, html, candidate.id, 'trial_welcome', attachments);
}

// ============================================================
// 9. Document Reminder
// ============================================================
export async function sendDocsReminder(candidate) {
  const data = {
    full_name:  candidate.full_name,
    portal_url: portalUrl(candidate.unique_token),
  };
  const html = fill(docsReminderEmail.html, data);
  const subj = fill(docsReminderEmail.subject, data);
  await send(candidate.email, subj, html, candidate.id, 'docs_reminder');
}

// ============================================================
// 10. Probation Extension
// ============================================================
export async function sendProbationExtension(candidate, extensionData) {
  const data = {
    full_name:          candidate.full_name,
    original_end_date:  fmt(extensionData.originalEndDate),
    new_end_date:       fmt(extensionData.newEndDate),
    extension_months:   extensionData.extensionMonths,
    extension_reason:   extensionData.reason,
    portal_url:         portalUrl(candidate.unique_token),
  };
  const html = fill(probationExtensionEmail.html, data);
  const subj = fill(probationExtensionEmail.subject, data);
  await send(candidate.email, subj, html, candidate.id, 'probation_extension');
}

// ============================================================
// 11. Trial Termination
// ============================================================
export async function sendTrialTermination(candidate, pdfBuffer) {
  const data = {
    full_name:       candidate.full_name,
    last_working_day: fmt(candidate.last_working_day),
    notice_period:   '7 days',
  };
  const html = fill(trialTerminationEmail.html, data);
  const subj = fill(trialTerminationEmail.subject, data);
  const attachments = pdfBuffer ? [{ filename: 'Termination_Letter.pdf', content: pdfBuffer }] : [];
  await send(candidate.email, subj, html, candidate.id, 'trial_termination', attachments);
}

// ============================================================
// 12. Confirmation
// ============================================================
export async function sendConfirmation(candidate, pdfBuffer) {
  const role = candidate.roles || {};
  const data = {
    full_name:         candidate.full_name,
    role_name:         role.role_name || 'the position',
    department:        role.department || '—',
    employee_id:       candidate.employee_id || '—',
    joining_date:      fmt(candidate.trial_start),
    trial_end:         fmt(candidate.trial_end),
    confirmation_date: fmt(new Date()),
    revised_ctc:       candidate.ctc || 'As per revised letter',
  };
  const html = fill(confirmationEmail.html, data);
  const subj = fill(confirmationEmail.subject, data);
  const attachments = pdfBuffer ? [{ filename: 'Confirmation_Letter.pdf', content: pdfBuffer }] : [];
  await send(candidate.email, subj, html, candidate.id, 'confirmation', attachments);
}

// ============================================================
// 13. Resignation Accepted
// ============================================================
export async function sendResignationAccepted(candidate) {
  const data = {
    full_name:        candidate.full_name,
    role_name:        candidate.roles?.role_name || 'the position',
    resignation_date: fmt(candidate.resignation_date),
    last_working_day: fmt(candidate.last_working_day),
    notice_period:    '30 days',
  };
  const html = fill(resignationAcceptedEmail.html, data);
  const subj = fill(resignationAcceptedEmail.subject, data);
  await send(candidate.email, subj, html, candidate.id, 'resignation_accepted');
}

// ============================================================
// 14. Offboarding Complete (with relieving + experience letter)
// ============================================================
export async function sendOffboardingComplete(candidate, pdfBuffers = {}) {
  const joiningDate   = new Date(candidate.trial_start || candidate.joining_date);
  const lastWorkingDay = new Date(candidate.last_working_day);
  const months = Math.round((lastWorkingDay - joiningDate) / (1000 * 60 * 60 * 24 * 30));
  const years  = Math.floor(months / 12);
  const rem    = months % 12;
  const tenure = years > 0
    ? `${years} year${years > 1 ? 's' : ''} ${rem > 0 ? `and ${rem} month${rem > 1 ? 's' : ''}` : ''}`
    : `${months} month${months > 1 ? 's' : ''}`;

  const data = {
    full_name:       candidate.full_name,
    role_name:       candidate.roles?.role_name || 'the position',
    joining_date:    fmt(candidate.trial_start),
    last_working_day: fmt(candidate.last_working_day),
    tenure,
  };
  const html = fill(offboardingCompleteEmail.html, data);
  const subj = fill(offboardingCompleteEmail.subject, data);
  const attachments = [];
  if (pdfBuffers.relieving)   attachments.push({ filename: 'Relieving_Letter.pdf',   content: pdfBuffers.relieving });
  if (pdfBuffers.experience)  attachments.push({ filename: 'Experience_Letter.pdf',  content: pdfBuffers.experience });
  await send(candidate.email, subj, html, candidate.id, 'offboarding_complete', attachments);
}

// ============================================================
// 15. HR Alert (internal — sent to HR team)
// ============================================================
export async function sendHRAlert(alertType, candidate, message, actionRequired) {
  const data = {
    alert_type:      alertType,
    alert_message:   message,
    full_name:       candidate.full_name,
    role_name:       candidate.roles?.role_name || '—',
    alert_date:      fmt(new Date()),
    action_required: actionRequired,
    dashboard_url:   `${FRONTEND_URL}/candidates/${candidate.id}`,
  };
  const html = fill(hrAlertEmail.html, data);
  const subj = fill(hrAlertEmail.subject, data);
  await send(HR_EMAIL, subj, html, candidate.id, 'hr_alert');
}

// ============================================================
// 16. Employee Credentials
// ============================================================
export async function sendEmployeeWelcome(candidate, companyEmail, password) {
  const data = {
    full_name: candidate.full_name,
    official_email: companyEmail,
    personal_email: candidate.email,
    password:  password,
    login_url: process.env.EMPLOYEE_APP_URL || 'http://localhost:3002',
  };
  const html = fill(employeeCredentialsEmail.html, data);
  const subj = fill(employeeCredentialsEmail.subject, data);
  // Send to personal email so they actually receive it
  await send(candidate.email, subj, html, candidate.id, 'employee_credentials');
}
