// ============================================================
// NELU — All HTML Email Templates
// Every email the system sends lives here.
// Placeholders use {{variable_name}} syntax.
// ============================================================

// Shared header and footer used by all emails
const header = (company = 'Nelu Adventures') => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { margin:0; padding:0; background:#f4f4f4; font-family: 'Poppins', 'Segoe UI', Arial, sans-serif; }
  .wrapper { max-width:600px; margin:0 auto; background:#ffffff; }
  .header { background:#ffffff; padding:28px 36px; text-align:center; border-bottom:1px solid #eeeeee; }
  .header-title { color:#014905; font-size:24px; font-weight:700; margin:0; letter-spacing:1px; font-family: 'Georgia Pro', Georgia, serif; }
  .header-sub { color:#9999cc; font-size:12px; margin:4px 0 0; }
  .body { padding:36px; }
  .logo-img { height:40px; width:auto; vertical-align:middle; margin-right:10px; display:inline-block; }
  .greeting { font-size:16px; color:#014905; font-weight:600; margin-bottom:16px; }
  p { font-size:14px; color:#444444; line-height:1.8; margin:0 0 14px; }
  .info-box { background:#f8f9ff; border-left:4px solid #FC922E; padding:16px 20px; border-radius:0 8px 8px 0; margin:20px 0; }
  .info-row { display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px; }
  .info-label { color:#888; font-weight:500; }
  .info-value { color:#000000; font-weight:600; }
  .btn { display:inline-block; background:#FC922E; color:#ffffff !important; text-decoration:none; padding:12px 28px; border-radius:6px; font-size:14px; font-weight:600; margin:8px 0; border:1px solid #FC922E; }
  .btn-danger { background:#dc3545; border-color:#dc3545; }
  .btn-success { background:#014905; border-color:#014905; }
  .divider { border:none; border-top:1px solid #eeeeee; margin:24px 0; }
  .footer { background:#f8f8f8; padding:20px 36px; border-top:1px solid #eeeeee; }
  .footer p { font-size:11px; color:#999999; margin:0; line-height:1.6; }
  .badge { display:inline-block; background:#fff3cd; color:#FC922E; font-size:12px; font-weight:600; padding:4px 12px; border-radius:20px; margin-bottom:16px; }
  table { width:100%; border-collapse:collapse; margin:16px 0; }
  th { background:#f8f9ff; padding:10px 14px; text-align:left; font-size:12px; color:#888; font-weight:600; border-bottom:2px solid #eeeeee; }
  td { padding:10px 14px; font-size:13px; color:#444; border-bottom:1px solid #f0f0f0; }
  .status-pill { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; }
  .status-green { background:#d4edda; color:#155724; }
  .status-red { background:#f8d7da; color:#721c24; }
  .status-blue { background:#d1ecf1; color:#0c5460; }
  .checklist li { font-size:13px; color:#444; line-height:2; }
  .important { background:#fff3cd; border-left:4px solid #ffc107; padding:12px 16px; border-radius:0 6px 6px 0; margin:16px 0; font-size:13px; color:#856404; }
</style>
</head>
<body>
<div class="wrapper">
<div class="header">
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0;">
    <tr>
      <td align="center" style="background:#ffffff; padding:20px 0;">
        <img src="https://res.cloudinary.com/dxkep3bnj/image/upload/Nelu_logo_uu6nni.png" 
             alt="Nelu Logo" 
             width="40"
             height="40"
             style="display:inline-block; vertical-align:middle; margin-right:10px; border:0;" />
        <span class="header-title" style="vertical-align:middle; color:#014905;">${company}</span>
      </td>
    </tr>
  </table>
  <div style="background:#014905; padding:10px; border-radius:0 0 0 0;">
     <p class="header-sub" style="color:#ffffff; margin:0; font-size:11px; letter-spacing:1px; text-transform:uppercase;">Human Resources Department</p>
  </div>
</div>
<div class="body">`;

const footer = (company = 'Nelu Adventures') => `
</div>
<div class="footer">
  <p>This email was sent by the HR system of <strong>${company}</strong>. Please do not reply to this email directly.</p>
  <p style="margin-top:6px">For queries, contact: operations.neluadventures@gmail.com | 90101 00524</p>
  <p style="margin-top:6px">© ${new Date().getFullYear()} ${company}. All rights reserved.</p>
</div>
</div>
</body>
</html>`;

// ============================================================
// Helper to fill placeholders: replaceAll('{{name}}', value)
// ============================================================
export function fillTemplate(template, data) {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replaceAll(`{{${key}}}`, value ?? '');
  }
  return result;
}

// ============================================================
// 1. APPLICATION ACKNOWLEDGEMENT
// Sent: immediately when form is submitted
// ============================================================
export const acknowledgementEmail = {
  subject: 'Application Received — {{role_name}} | {{company}}',
  html: (data) => header(data.company) + `
<div class="badge">Application Received</div>
<p class="greeting">Dear {{full_name}},</p>
<p>Thank you for applying for the position of <strong>{{role_name}}</strong> at <strong>{{company}}</strong>. We have successfully received your application.</p>
<div class="info-box">
  <table>
    <tr><td class="info-label">Reference ID</td><td class="info-value">#{{ref_id}}</td></tr>
    <tr><td class="info-label">Position Applied</td><td class="info-value">{{role_name}}</td></tr>
    <tr><td class="info-label">Applied On</td><td class="info-value">{{applied_date}}</td></tr>
    <tr><td class="info-label">Status</td><td class="info-value"><span class="status-pill status-blue">Under Review</span></td></tr>
  </table>
</div>
<p>Our HR team will review your application and get back to you within <strong>5–7 working days</strong>. We receive a high volume of applications so we appreciate your patience.</p>
<p>We will contact you at this email address for all future communications regarding your application.</p>
<hr class="divider">
<p style="font-size:13px;color:#888">Please keep this email for your reference. Your Reference ID is <strong>#{{ref_id}}</strong>.</p>
` + footer(data.company),
};

// ============================================================
// 2. INTERVIEW INVITATION
// Sent: when HR shortlists a candidate
// ============================================================
export const interviewInvitationEmail = {
  subject: 'Interview Invitation — {{role_name}} | {{company}}',
  html: (data) => header(data.company) + `
<div class="badge">Interview Invitation</div>
<p class="greeting">Dear {{full_name}},</p>
<p>Congratulations! After reviewing your application for <strong>{{role_name}}</strong>, we are pleased to invite you for an interview with our team.</p>
<div class="info-box">
  <table>
    <tr><td class="info-label">Position</td><td class="info-value">{{role_name}}</td></tr>
    <tr><td class="info-label">Date & Time</td><td class="info-value">{{interview_date}} at {{interview_time}}</td></tr>
    <tr><td class="info-label">Mode</td><td class="info-value">{{interview_mode}}</td></tr>
    <tr><td class="info-label">{{location_label}}</td><td class="info-value">{{interview_location}}</td></tr>
    <tr><td class="info-label">Duration</td><td class="info-value">Approximately 45–60 minutes</td></tr>
  </table>
</div>
<p><strong>What to bring / prepare:</strong></p>
<ul class="checklist">
  <li>Updated resume (2 copies if in-person)</li>
  <li>Government-issued photo ID (Aadhaar / PAN)</li>
  <li>Any previous work portfolio or projects</li>
  <li>List of references (if applicable)</li>
</ul>
{{interview_link_section}}
<div class="important">Please confirm your attendance by replying to operations.neluadventures@gmail.com or clicking the button below. If you need to reschedule, please inform us at least 24 hours in advance.</div>
<a href="{{portal_url}}" class="btn">Confirm Attendance</a>
` + footer(data.company),
};

// ============================================================
// 3. INTERVIEW REMINDER (24 hours before)
// Sent: by cron job, 24 hours before interview_at
// ============================================================
export const interviewReminderEmail = {
  subject: 'Reminder: Your Interview Tomorrow — {{company}}',
  html: (data) => header(data.company) + `
<div class="badge">Interview Reminder</div>
<p class="greeting">Dear {{full_name}},</p>
<p>This is a friendly reminder that your interview for <strong>{{role_name}}</strong> is scheduled for <strong>tomorrow</strong>.</p>
<div class="info-box">
  <table>
    <tr><td class="info-label">Date & Time</td><td class="info-value">{{interview_date}} at {{interview_time}}</td></tr>
    <tr><td class="info-label">Mode</td><td class="info-value">{{interview_mode}}</td></tr>
    <tr><td class="info-label">{{location_label}}</td><td class="info-value">{{interview_location}}</td></tr>
  </table>
</div>
<p>Please ensure you are prepared and on time. If you are unable to attend, contact us immediately at operations.neluadventures@gmail.com.</p>
<p>We look forward to speaking with you!</p>
` + footer(data.company),
};

// ============================================================
// 4. REJECTION EMAIL
// Sent: when HR rejects at any stage
// ============================================================
export const rejectionEmail = {
  subject: 'Application Update — {{role_name}} | {{company}}',
  html: (data) => header(data.company) + `
<div class="badge">Application Update</div>
<p class="greeting">Dear {{full_name}},</p>
<p>Thank you for your interest in the position of <strong>{{role_name}}</strong> at <strong>{{company}}</strong> and for the time you invested in our selection process.</p>
<p>After careful consideration, we regret to inform you that we will not be moving forward with your application at this time. This decision was not easy, as we received many strong applications.</p>
<p>This does not reflect on your overall qualifications and we encourage you to apply again in the future if a suitable position opens up.</p>
<div class="info-box">
  <p style="margin:0;font-size:13px;color:#444"><strong>We will retain your profile</strong> in our database for 6 months and may reach out if a matching role becomes available.</p>
</div>
<p>We wish you all the very best in your career journey.</p>
` + footer(data.company),
};

// ============================================================
// 5. OFFER LETTER EMAIL (with PDF attached)
// Sent: when HR selects candidate and sends offer
// ============================================================
export const offerLetterEmail = {
  subject: 'Offer Letter — {{role_name}} | {{company}}',
  html: (data) => header(data.company) + `
<div class="badge">Congratulations — You're Selected!</div>
<p class="greeting">Dear {{full_name}},</p>
<p>We are delighted to offer you the position of <strong>{{role_name}}</strong> at <strong>{{company}}</strong>. After a thorough evaluation, we believe you will be a valuable addition to our team.</p>
<div class="info-box">
  <table>
    <tr><td class="info-label">Position</td><td class="info-value">{{role_name}}</td></tr>
    <tr><td class="info-label">Department</td><td class="info-value">{{department}}</td></tr>
    <tr><td class="info-label">Employment Type</td><td class="info-value">{{employment_type}}</td></tr>
    <tr><td class="info-label">CTC / Stipend</td><td class="info-value">{{ctc}}</td></tr>
    <tr><td class="info-label">Trial Period</td><td class="info-value">{{probation_months}} months</td></tr>
    <tr><td class="info-label">Proposed Joining Date</td><td class="info-value">{{joining_date}}</td></tr>
    <tr><td class="info-label">Respond By</td><td class="info-value">{{offer_deadline}}</td></tr>
  </table>
</div>
<p>Please find the detailed <strong>Offer Letter</strong> attached to this email as a PDF. Kindly read it carefully and respond via your candidate portal.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
  <tr>
    <td align="left">
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" bgcolor="#014905" style="border-radius:6px;">
            <a href="{{accept_url}}" style="display:inline-block; padding:12px 28px; color:#ffffff; font-size:14px; font-weight:600; text-decoration:none; background:#014905; border-radius:6px;">Accept Offer</a>
          </td>
          <td width="16"></td>
          <td align="center" bgcolor="#dc3545" style="border-radius:6px;">
            <a href="{{decline_url}}" style="display:inline-block; padding:12px 28px; color:#ffffff; font-size:14px; font-weight:600; text-decoration:none; background:#dc3545; border-radius:6px;">Decline Offer</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
<div class="important">This offer expires on <strong>{{offer_deadline}}</strong>. If we do not hear from you by then, the offer will be automatically withdrawn.</div>
` + footer(data.company),
};

// ============================================================
// 6. OFFER ACCEPTANCE CONFIRMATION
// Sent: when candidate accepts the offer
// ============================================================
export const offerAcceptanceEmail = {
  subject: 'Welcome to {{company}} — Joining Confirmation',
  html: (data) => header(data.company) + `
<div class="badge">Offer Accepted — Welcome!</div>
<p class="greeting">Dear {{full_name}},</p>
<p>We are thrilled to confirm that you have accepted our offer for the position of <strong>{{role_name}}</strong>. Welcome to the <strong>{{company}}</strong> family!</p>
<div class="info-box">
  <table>
    <tr><td class="info-label">Joining Date</td><td class="info-value">{{joining_date}}</td></tr>
    <tr><td class="info-label">Reporting Time</td><td class="info-value">9:00 AM</td></tr>
    <tr><td class="info-label">Reporting Manager</td><td class="info-value">{{manager_name}}</td></tr>
    <tr><td class="info-label">Office Address</td><td class="info-value">{{office_address}}</td></tr>
  </table>
</div>
<p><strong>On your first day, please bring:</strong></p>
<ul class="checklist">
  <li>This email (printed or on phone)</li>
  <li>Original Aadhaar Card</li>
  <li>Original PAN Card</li>
  <li>2 passport-size photographs</li>
  <li>All original educational certificates</li>
  <li>Experience letters (if applicable)</li>
  <li>Bank account details (cancelled cheque)</li>
</ul>
<p>You will receive a separate email 7 days before joining with the complete document checklist and upload link.</p>
<a href="{{portal_url}}" class="btn">Visit Your Portal</a>
` + footer(data.company),
};

// ============================================================
// 7. DOCUMENT COLLECTION (7 days before joining)
// Sent: by cron job, 7 days before joining_date
// ============================================================
export const documentCollectionEmail = {
  subject: 'Action Required: Upload Documents Before Joining | {{company}}',
  html: (data) => header(data.company) + `
<div class="badge">Document Submission Required</div>
<p class="greeting">Dear {{full_name}},</p>
<p>Your joining date is approaching (<strong>{{joining_date}}</strong>). Please upload the following documents through your candidate portal before joining to ensure a smooth onboarding experience.</p>
<div class="important">Documents must be uploaded at least <strong>2 days before</strong> your joining date.</div>
<p><strong>Required Documents:</strong></p>
<ul class="checklist">
  <li>Aadhaar Card (front and back)</li>
  <li>PAN Card</li>
  <li>10th Standard Marksheet</li>
  <li>12th Standard Marksheet</li>
  <li>Degree Certificate / Provisional Certificate</li>
  <li>Experience Letters from all previous employers</li>
  <li>Bank Passbook / Cancelled Cheque (for salary account)</li>
  <li>2 Passport-size photographs</li>
</ul>
<p>All documents must be clear, readable, and in PDF or JPG format.</p>
<a href="{{portal_url}}" class="btn">Upload Documents Now</a>
<p style="margin-top:16px;font-size:12px;color:#888">If you have any issues uploading, contact operations.neluadventures@gmail.com immediately.</p>
` + footer(data.company),
};

// ============================================================
// 8. TRIAL PERIOD WELCOME (on joining date)
// Sent: on joining_date with appointment letter PDF attached
// ============================================================
export const trialWelcomeEmail = {
  subject: 'Welcome to {{company}} — Trial Period Begins Today',
  html: (data) => header(data.company) + `
<div class="badge">Welcome — Day 1</div>
<p class="greeting">Dear {{full_name}},</p>
<p>A very warm welcome to <strong>{{company}}</strong>! We are excited to have you join us as <strong>{{role_name}}</strong> in the <strong>{{department}}</strong> department.</p>
<div class="info-box">
  <table>
    <tr><td class="info-label">Employee ID</td><td class="info-value">{{employee_id}}</td></tr>
    <tr><td class="info-label">Trial Start Date</td><td class="info-value">{{trial_start}}</td></tr>
    <tr><td class="info-label">Trial End Date</td><td class="info-value">{{trial_end}}</td></tr>
    <tr><td class="info-label">Duration</td><td class="info-value">{{probation_months}} months</td></tr>
    <tr><td class="info-label">Reporting Manager</td><td class="info-value">{{manager_name}}</td></tr>
  </table>
</div>
<p>Your <strong>Appointment Letter</strong> is attached to this email. Please read it carefully. During the trial period, your performance, attitude, and cultural fit will be evaluated.</p>
<p><strong>Key expectations during trial period:</strong></p>
<ul class="checklist">
  <li>Report on time every day</li>
  <li>Complete assigned tasks with quality</li>
  <li>Attend all team meetings and reviews</li>
  <li>Maintain professional conduct</li>
  <li>Complete any assigned training modules</li>
</ul>
<p>You will receive a mid-trial review at the halfway point. At the end of the trial period, HR will communicate the outcome — confirmation, extension, or termination.</p>
<p>We look forward to great work together!</p>
` + footer(data.company),
};

// ============================================================
// 9. DOCUMENT REMINDER (when docs not uploaded after 3 days)
// Sent: by cron job
// ============================================================
export const docsReminderEmail = {
  subject: 'Reminder: Documents Pending | {{company}}',
  html: (data) => header(data.company) + `
<div class="badge">Documents Pending</div>
<p class="greeting">Dear {{full_name}},</p>
<p>This is a reminder that your documents are still pending submission. Your employment confirmation <strong>cannot be processed</strong> until all documents are verified.</p>
<div class="important">Please upload your documents immediately to avoid delays in your confirmation process.</div>
<a href="{{portal_url}}" class="btn">Upload Documents Now</a>
<p style="margin-top:16px;font-size:12px;color:#888">If you are facing any issues, please contact operations.neluadventures@gmail.com</p>
` + footer(data.company),
};

// ============================================================
// 10. PROBATION EXTENSION
// Sent: when HR extends probation
// ============================================================
export const probationExtensionEmail = {
  subject: 'Probation Period Extension Notice | {{company}}',
  html: (data) => header(data.company) + `
<div class="badge">Probation Extended</div>
<p class="greeting">Dear {{full_name}},</p>
<p>This is to inform you that your trial period at <strong>{{company}}</strong> has been extended.</p>
<div class="info-box">
  <table>
    <tr><td class="info-label">Original End Date</td><td class="info-value">{{original_end_date}}</td></tr>
    <tr><td class="info-label">Extended End Date</td><td class="info-value">{{new_end_date}}</td></tr>
    <tr><td class="info-label">Extension Duration</td><td class="info-value">{{extension_months}} month(s)</td></tr>
    <tr><td class="info-label">Reason</td><td class="info-value">{{extension_reason}}</td></tr>
  </table>
</div>
<p>We believe in giving you the opportunity to demonstrate your full potential. During the extended period, please focus on the areas mentioned by your reporting manager.</p>
<p>The extension letter is attached to this email. Please acknowledge receipt by visiting your portal.</p>
<a href="{{portal_url}}" class="btn">Acknowledge</a>
` + footer(data.company),
};

// ============================================================
// 11. TRIAL TERMINATION
// Sent: when HR terminates during trial
// ============================================================
export const trialTerminationEmail = {
  subject: 'Employment Termination Notice | {{company}}',
  html: (data) => header(data.company) + `
<div class="badge">Employment Update</div>
<p class="greeting">Dear {{full_name}},</p>
<p>After careful evaluation of your performance during the trial period, we regret to inform you that your employment with <strong>{{company}}</strong> will be terminated effective <strong>{{last_working_day}}</strong>.</p>
<div class="info-box">
  <table>
    <tr><td class="info-label">Last Working Day</td><td class="info-value">{{last_working_day}}</td></tr>
    <tr><td class="info-label">Notice Period</td><td class="info-value">{{notice_period}}</td></tr>
    <tr><td class="info-label">Final Settlement</td><td class="info-value">Within 7 working days of last day</td></tr>
  </table>
</div>
<p>Please complete the following before your last working day:</p>
<ul class="checklist">
  <li>Return all company property (laptop, ID card, access cards)</li>
  <li>Complete handover of pending work</li>
  <li>Clear any pending dues</li>
</ul>
<p>The termination letter is attached to this email. Your experience letter will be provided on or before your last working day.</p>
<p>We wish you the best in your future endeavours.</p>
` + footer(data.company),
};

// ============================================================
// 12. CONFIRMATION LETTER EMAIL
// Sent: when trial is successful and docs verified
// ============================================================
export const confirmationEmail = {
  subject: 'Congratulations — Employment Confirmed | {{company}}',
  html: (data) => header(data.company) + `
<div class="badge">Permanent Employee — Confirmed</div>
<p class="greeting">Dear {{full_name}},</p>
<p>We are extremely pleased to inform you that you have successfully completed your trial period at <strong>{{company}}</strong> and are hereby confirmed as a <strong>Permanent Employee</strong> effective <strong>{{confirmation_date}}</strong>.</p>
<div class="info-box">
  <table>
    <tr><td class="info-label">Employee ID</td><td class="info-value">{{employee_id}}</td></tr>
    <tr><td class="info-label">Designation</td><td class="info-value">{{role_name}}</td></tr>
    <tr><td class="info-label">Department</td><td class="info-value">{{department}}</td></tr>
    <tr><td class="info-label">Confirmation Date</td><td class="info-value">{{confirmation_date}}</td></tr>
    <tr><td class="info-label">Revised CTC</td><td class="info-value">{{revised_ctc}}</td></tr>
  </table>
</div>
<p>Your <strong>Confirmation Letter</strong> is attached to this email. As a confirmed employee, you are now entitled to all company benefits including health insurance, PF, and paid leaves as per company policy.</p>
<p>Thank you for your dedication and hard work. We look forward to your continued contribution to the team!</p>
` + footer(data.company),
};

// ============================================================
// 13. RESIGNATION ACCEPTED
// Sent: when HR accepts resignation
// ============================================================
export const resignationAcceptedEmail = {
  subject: 'Resignation Accepted — Offboarding Process | {{company}}',
  html: (data) => header(data.company) + `
<div class="badge">Resignation Accepted</div>
<p class="greeting">Dear {{full_name}},</p>
<p>We have received and accepted your resignation from the position of <strong>{{role_name}}</strong> at <strong>{{company}}</strong>.</p>
<div class="info-box">
  <table>
    <tr><td class="info-label">Resignation Date</td><td class="info-value">{{resignation_date}}</td></tr>
    <tr><td class="info-label">Last Working Day</td><td class="info-value">{{last_working_day}}</td></tr>
    <tr><td class="info-label">Notice Period</td><td class="info-value">{{notice_period}}</td></tr>
  </table>
</div>
<p><strong>Please complete the following exit process before your last working day:</strong></p>
<ul class="checklist">
  <li>Complete work handover to your reporting manager</li>
  <li>Return all company property (laptop, ID card, access cards, keys)</li>
  <li>Clear any pending leaves or dues</li>
  <li>Complete the exit interview (link will be sent separately)</li>
  <li>Update company email contacts about your last day</li>
</ul>
<p>Your <strong>Experience Letter and Relieving Letter</strong> will be sent to you on or before your last working day.</p>
<p>We are sad to see you go and wish you all the best in your next chapter. Thank you for your contributions to the team.</p>
` + footer(data.company),
};

// ============================================================
// 14. OFFBOARDING COMPLETE (relieving letter sent)
// Sent: on last working day
// ============================================================
export const offboardingCompleteEmail = {
  subject: 'Relieving Letter & Experience Letter | {{company}}',
  html: (data) => header(data.company) + `
<div class="badge">Offboarding Complete</div>
<p class="greeting">Dear {{full_name}},</p>
<p>Today marks your last working day at <strong>{{company}}</strong>. On behalf of the entire team, we thank you for your valuable contributions during your time with us.</p>
<div class="info-box">
  <table>
    <tr><td class="info-label">Date of Joining</td><td class="info-value">{{joining_date}}</td></tr>
    <tr><td class="info-label">Last Working Day</td><td class="info-value">{{last_working_day}}</td></tr>
    <tr><td class="info-label">Total Tenure</td><td class="info-value">{{tenure}}</td></tr>
    <tr><td class="info-label">Designation</td><td class="info-value">{{role_name}}</td></tr>
  </table>
</div>
<p>Attached to this email you will find:</p>
<ul class="checklist">
  <li><strong>Relieving Letter</strong> — confirms you have been relieved of all duties</li>
  <li><strong>Experience Letter</strong> — certifying your employment with us</li>
</ul>
<p>Your final settlement will be processed within 7 working days.</p>
<p>We wish you great success in all your future endeavours. You are always welcome to apply again or refer people to us.</p>
` + footer(data.company),
};

// ============================================================
// 15. HR ALERT EMAILS (internal — sent to HR team)
// ============================================================
export const hrAlertEmail = {
  subject: '[HR ALERT] {{alert_type}} | {{company}}',
  html: (data) => header(data.company) + `
<div class="badge">HR Team Alert</div>
<p class="greeting">HR Team,</p>
<p>This is an automated alert requiring your attention:</p>
<div class="info-box">
  <p style="font-size:15px;font-weight:600;color:#1a1a2e;margin:0 0 12px">{{alert_message}}</p>
  <table>
    <tr><td class="info-label">Candidate / Employee</td><td class="info-value">{{full_name}}</td></tr>
    <tr><td class="info-label">Position</td><td class="info-value">{{role_name}}</td></tr>
    <tr><td class="info-label">Date</td><td class="info-value">{{alert_date}}</td></tr>
    <tr><td class="info-label">Action Required</td><td class="info-value">{{action_required}}</td></tr>
  </table>
</div>
<a href="{{dashboard_url}}" class="btn">Open Dashboard →</a>
` + footer(data.company),
};
// ============================================================
// 16. EMPLOYEE CREDENTIALS
// Sent: when a new employee account is provisioned
// ============================================================
export const employeeCredentialsEmail = {
  subject: 'Welcome to {{company}} — Your Official Employee Credentials',
  html: (data) => header(data.company) + `
<div class="badge">Onboarding — Access Credentials</div>
<p class="greeting">Welcome to the Team, {{full_name}}!</p>
<p>We are excited to have you on board. To help you get started, we have provisioned your official company account and employee portal access.</p>

<div class="info-box">
  <p style="margin:0 0 12px; font-weight:600; color:#014905;">Corporate Account Details:</p>
  <table>
    <tr><td class="info-label">Official Email</td><td class="info-value"><strong>{{official_email}}</strong></td></tr>
    <tr><td class="info-label">Login Password</td><td class="info-value"><code>{{password}}</code></td></tr>
    <tr><td class="info-label">Portal Access</td><td class="info-value"><a href="{{login_url}}">Employee Dashboard →</a></td></tr>
  </table>
</div>

<div class="important">
  <strong>Note:</strong> From today onwards, please use <strong>{{official_email}}</strong> for all official communications and portal logins. Your personal email ({{personal_email}}) will no longer be used for system notifications.
</div>

<p><strong>Next Steps:</strong></p>
<ul class="checklist">
  <li>Log in to the <a href="{{login_url}}">Employee Portal</a> using the credentials above.</li>
  <li>Change your temporary password immediately upon first login.</li>
  <li>Complete your profile setup and tax declarations.</li>
  <li>Review the employee handbook in the 'Documents' section.</li>
</ul>

<p>If you encounter any issues accessing your account, please contact the IT support team at operations.neluadventures@gmail.com.</p>
<p>Welcome to <strong>{{company}}</strong>!</p>
` + footer(data.company),
};
