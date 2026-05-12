// ============================================================
// NELU — All PDF Templates (HTML → Puppeteer → PDF)
// Every PDF the system generates lives here.
// Placeholders use {{variable_name}} syntax.
// ============================================================

const pdfStyles = `
<style>
  @page { margin: 25mm 20mm; }
  body { font-family: 'Times New Roman', serif; font-size: 13px; color: #000; line-height: 1.6; }
  .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 14px; margin-bottom: 20px; }
  .company-name { font-size: 22px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 0; }
  .company-sub { font-size: 11px; color: #333; margin: 4px 0 0; }
  .doc-title { text-align: center; font-size: 16px; font-weight: bold; text-decoration: underline; text-transform: uppercase; margin: 20px 0; letter-spacing: 1px; }
  .ref-date { display: flex; justify-content: space-between; font-size: 12px; color: #333; margin-bottom: 20px; }
  .salutation { margin: 0 0 14px; font-weight: bold; }
  p { margin: 0 0 12px; text-align: justify; }
  .terms-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  .terms-table th { background: #f0f0f0; padding: 8px 12px; border: 1px solid #ccc; font-size: 12px; text-align: left; font-weight: bold; }
  .terms-table td { padding: 8px 12px; border: 1px solid #ccc; font-size: 12px; vertical-align: top; }
  .terms-table td:first-child { font-weight: bold; width: 35%; }
  .signature-block { margin-top: 50px; display: flex; justify-content: space-between; }
  .sig-col { text-align: center; }
  .sig-line { border-top: 1px solid #000; margin-bottom: 6px; width: 160px; }
  .sig-name { font-weight: bold; font-size: 12px; }
  .sig-title { font-size: 11px; color: #555; }
  .watermark { position: fixed; top: 40%; left: 15%; opacity: 0.06; font-size: 80px; font-weight: bold; transform: rotate(-45deg); color: #000; z-index: -1; text-transform: uppercase; }
  .clause { margin: 0 0 10px; }
  .clause strong { display: block; margin-bottom: 4px; }
  .footer-note { border-top: 1px solid #ccc; margin-top: 30px; padding-top: 10px; font-size: 11px; color: #555; text-align: center; }
  .stamp-area { float: right; text-align: center; border: 1px dashed #999; width: 120px; height: 80px; padding: 8px; font-size: 10px; color: #999; margin-top: -20px; }
</style>`;

// ============================================================
// 1. OFFER LETTER (for full-time positions)
// ============================================================
export const offerLetterPDF = (data) => `<!DOCTYPE html>
<html><head><meta charset="utf-8">${pdfStyles}</head><body>
<div class="watermark">{{company}}</div>
<div class="header">
  <p class="company-name">{{company}}</p>
  <p class="company-sub">{{company_address}}</p>
  <p class="company-sub">HR Department | operations.neluadventures@gmail.com</p>
</div>
<div class="doc-title">Offer Letter</div>
<div class="ref-date">
  <span>Ref No: {{ref_id}}</span>
  <span>Date: {{issued_date}}</span>
</div>
<p class="salutation">Dear {{full_name}},</p>
<p>We are pleased to offer you the position of <strong>{{role_name}}</strong> in the <strong>{{department}}</strong> department at <strong>{{company}}</strong>, subject to the terms and conditions mentioned below.</p>
<table class="terms-table">
  <tr><th colspan="2">Offer Details</th></tr>
  <tr><td>Full Name</td><td>{{full_name}}</td></tr>
  <tr><td>Designation</td><td>{{role_name}}</td></tr>
  <tr><td>Department</td><td>{{department}}</td></tr>
  <tr><td>Employment Type</td><td>{{employment_type}}</td></tr>
  <tr><td>CTC Per Annum</td><td>{{ctc}}</td></tr>
  <tr><td>Proposed Date of Joining</td><td>{{joining_date}}</td></tr>
  <tr><td>Trial / Probation Period</td><td>{{probation_months}} months from date of joining</td></tr>
  <tr><td>Work Location</td><td>{{work_location}}</td></tr>
  <tr><td>Working Hours</td><td>9:00 AM to 6:00 PM (Monday to Saturday)</td></tr>
  <tr><td>Notice Period (After Confirmation)</td><td>{{notice_period}} days</td></tr>
</table>
<p class="clause"><strong>1. Nature of Employment:</strong> Your employment will initially be on a trial/probationary basis for a period of {{probation_months}} months. Upon satisfactory completion of the probation period and submission of all required documents, your employment will be confirmed as a permanent employee.</p>
<p class="clause"><strong>2. Compensation:</strong> The compensation details are as mentioned above. Your salary will be subject to applicable tax deductions as per Indian Income Tax laws. A detailed salary breakup will be provided at the time of joining.</p>
<p class="clause"><strong>3. Confidentiality:</strong> You are required to maintain strict confidentiality regarding all company information, client data, and proprietary materials both during and after your employment.</p>
<p class="clause"><strong>4. Acceptance:</strong> This offer is valid until <strong>{{offer_deadline}}</strong>. Kindly confirm your acceptance in writing by this date. Failure to respond will result in automatic withdrawal of this offer.</p>
<p class="clause"><strong>5. Background Verification:</strong> This offer is subject to satisfactory background verification including academic credentials, previous employment, and personal references.</p>
<p>Please sign and return a copy of this letter as your acceptance. We look forward to welcoming you to the team.</p>
<div class="signature-block">
  <div class="sig-col">
    <div class="sig-line"></div>
    <div class="sig-name">{{hr_name}}</div>
    <div class="sig-title">HR Manager, {{company}}</div>
    <div class="sig-title">Date: {{issued_date}}</div>
  </div>
  <div class="sig-col">
    <div class="stamp-area">Company<br>Seal / Stamp</div>
  </div>
  <div class="sig-col">
    <div class="sig-line"></div>
    <div class="sig-name">{{full_name}}</div>
    <div class="sig-title">Candidate Signature</div>
    <div class="sig-title">Date: ___________</div>
  </div>
</div>
<div class="footer-note">This is a computer-generated document. | {{company}} | {{company_address}}</div>
</body></html>`;

// ============================================================
// 2. INTERNSHIP OFFER LETTER
// ============================================================
export const internshipOfferLetterPDF = (data) => `<!DOCTYPE html>
<html><head><meta charset="utf-8">${pdfStyles}</head><body>
<div class="watermark">{{company}}</div>
<div class="header">
  <p class="company-name">{{company}}</p>
  <p class="company-sub">{{company_address}}</p>
</div>
<div class="doc-title">Internship Offer Letter</div>
<div class="ref-date">
  <span>Ref No: {{ref_id}}</span>
  <span>Date: {{issued_date}}</span>
</div>
<p class="salutation">Dear {{full_name}},</p>
<p>We are pleased to offer you an internship opportunity at <strong>{{company}}</strong>. This letter confirms the details of your internship.</p>
<table class="terms-table">
  <tr><th colspan="2">Internship Details</th></tr>
  <tr><td>Name</td><td>{{full_name}}</td></tr>
  <tr><td>College / University</td><td>{{college_name}}</td></tr>
  <tr><td>Internship Role</td><td>{{role_name}}</td></tr>
  <tr><td>Department</td><td>{{department}}</td></tr>
  <tr><td>Start Date</td><td>{{joining_date}}</td></tr>
  <tr><td>End Date</td><td>{{internship_end_date}}</td></tr>
  <tr><td>Duration</td><td>{{duration}} months</td></tr>
  <tr><td>Monthly Stipend</td><td>{{ctc}} per month</td></tr>
  <tr><td>Mode</td><td>{{work_mode}}</td></tr>
  <tr><td>Working Hours</td><td>9:00 AM – 6:00 PM</td></tr>
  <tr><td>Mentor</td><td>{{manager_name}}</td></tr>
</table>
<p class="clause"><strong>1. Nature of Internship:</strong> This is a paid internship program. You will work on real projects under the guidance of your assigned mentor.</p>
<p class="clause"><strong>2. Confidentiality:</strong> You are required to maintain confidentiality of all company information and data that you may access during your internship.</p>
<p class="clause"><strong>3. Completion Certificate:</strong> Upon successful completion of the internship, you will be awarded an Internship Completion Certificate and an Experience Letter.</p>
<p class="clause"><strong>4. Pre-Placement Offer:</strong> Based on your performance, you may be considered for a Pre-Placement Offer (PPO) for a full-time position at {{company}}.</p>
<p>We are excited to have you join us and look forward to your contributions.</p>
<div class="signature-block">
  <div class="sig-col">
    <div class="sig-line"></div>
    <div class="sig-name">{{hr_name}}</div>
    <div class="sig-title">HR Manager, {{company}}</div>
  </div>
  <div class="sig-col">
    <div class="stamp-area">Company<br>Seal / Stamp</div>
  </div>
  <div class="sig-col">
    <div class="sig-line"></div>
    <div class="sig-name">{{full_name}}</div>
    <div class="sig-title">Candidate Signature</div>
  </div>
</div>
<div class="footer-note">This is a computer-generated document. | {{company}}</div>
</body></html>`;

// ============================================================
// 3. APPOINTMENT LETTER (on joining day — full time)
// ============================================================
export const appointmentLetterPDF = (data) => `<!DOCTYPE html>
<html><head><meta charset="utf-8">${pdfStyles}</head><body>
<div class="watermark">{{company}}</div>
<div class="header">
  <p class="company-name">{{company}}</p>
  <p class="company-sub">{{company_address}}</p>
</div>
<div class="doc-title">Appointment Letter</div>
<div class="ref-date">
  <span>Ref No: APPT/{{employee_id}}/{{year}}</span>
  <span>Date: {{issued_date}}</span>
</div>
<p class="salutation">Dear {{full_name}},</p>
<p>We are pleased to appoint you as <strong>{{role_name}}</strong> in the <strong>{{department}}</strong> department at <strong>{{company}}</strong> with effect from <strong>{{joining_date}}</strong>, subject to the terms and conditions mentioned herein.</p>
<table class="terms-table">
  <tr><th colspan="2">Employment Details</th></tr>
  <tr><td>Employee ID</td><td>{{employee_id}}</td></tr>
  <tr><td>Full Name</td><td>{{full_name}}</td></tr>
  <tr><td>Designation</td><td>{{role_name}}</td></tr>
  <tr><td>Department</td><td>{{department}}</td></tr>
  <tr><td>Date of Joining</td><td>{{joining_date}}</td></tr>
  <tr><td>Trial Period End</td><td>{{trial_end}}</td></tr>
  <tr><td>Gross Salary / Stipend</td><td>{{ctc}}</td></tr>
  <tr><td>Reporting To</td><td>{{manager_name}}</td></tr>
  <tr><td>Work Location</td><td>{{work_location}}</td></tr>
</table>
<p class="clause"><strong>1. Probationary Period:</strong> Your initial appointment is on a probationary basis for {{probation_months}} months from the date of joining. During this period, your performance, conduct, and suitability will be evaluated. Satisfactory completion of probation and verification of all documents will lead to your confirmation as a permanent employee.</p>
<p class="clause"><strong>2. Duties & Responsibilities:</strong> You shall perform all duties assigned to you by your reporting manager or management, and may be assigned additional responsibilities as the company grows.</p>
<p class="clause"><strong>3. Compensation:</strong> Your salary will be as mentioned above. The company is entitled to deduct applicable statutory deductions such as PF, PT, and TDS as per law.</p>
<p class="clause"><strong>4. Confidentiality & Non-Disclosure:</strong> You shall keep all company information, client data, trade secrets, and business processes strictly confidential during and after your employment.</p>
<p class="clause"><strong>5. Intellectual Property:</strong> All work product created during your employment shall be the exclusive property of {{company}}.</p>
<p class="clause"><strong>6. Termination During Probation:</strong> Either party may terminate this employment during the probation period with {{notice_period}} days' notice or payment in lieu thereof.</p>
<p class="clause"><strong>7. Code of Conduct:</strong> You are expected to adhere to all company policies, code of conduct, and workplace ethics as communicated from time to time.</p>
<p>Please sign and return a copy of this letter acknowledging your acceptance of the terms stated above.</p>
<div class="signature-block">
  <div class="sig-col">
    <div class="sig-line"></div>
    <div class="sig-name">{{hr_name}}</div>
    <div class="sig-title">HR Manager, {{company}}</div>
    <div class="sig-title">Date: {{issued_date}}</div>
  </div>
  <div class="sig-col">
    <div class="stamp-area">Company<br>Seal / Stamp</div>
  </div>
  <div class="sig-col">
    <div class="sig-line"></div>
    <div class="sig-name">{{full_name}}</div>
    <div class="sig-title">Employee Signature</div>
    <div class="sig-title">Date: ___________</div>
  </div>
</div>
<div class="footer-note">This is a computer-generated document. | {{company}} | {{company_address}}</div>
</body></html>`;

// ============================================================
// 4. PROBATION EXTENSION LETTER
// ============================================================
export const probationExtensionPDF = (data) => `<!DOCTYPE html>
<html><head><meta charset="utf-8">${pdfStyles}</head><body>
<div class="header">
  <p class="company-name">{{company}}</p>
  <p class="company-sub">{{company_address}}</p>
</div>
<div class="doc-title">Probation Extension Letter</div>
<div class="ref-date">
  <span>Ref No: PROB-EXT/{{employee_id}}/{{year}}</span>
  <span>Date: {{issued_date}}</span>
</div>
<p class="salutation">Dear {{full_name}},</p>
<p>With reference to your appointment letter dated <strong>{{joining_date}}</strong> for the position of <strong>{{role_name}}</strong>, we wish to inform you that your probationary period, which was originally scheduled to end on <strong>{{original_end_date}}</strong>, is hereby extended.</p>
<table class="terms-table">
  <tr><td>Employee ID</td><td>{{employee_id}}</td></tr>
  <tr><td>Designation</td><td>{{role_name}}</td></tr>
  <tr><td>Original Probation End Date</td><td>{{original_end_date}}</td></tr>
  <tr><td>Extended Probation End Date</td><td>{{new_end_date}}</td></tr>
  <tr><td>Extension Period</td><td>{{extension_months}} month(s)</td></tr>
  <tr><td>Reason for Extension</td><td>{{extension_reason}}</td></tr>
</table>
<p>During this extended period, we expect you to demonstrate significant improvement in the areas mentioned during your performance review. Your performance will be closely monitored by your reporting manager.</p>
<p>Please acknowledge receipt of this letter by signing and returning a copy.</p>
<div class="signature-block">
  <div class="sig-col">
    <div class="sig-line"></div>
    <div class="sig-name">{{hr_name}}</div>
    <div class="sig-title">HR Manager, {{company}}</div>
  </div>
  <div class="sig-col">
    <div class="sig-line"></div>
    <div class="sig-name">{{full_name}}</div>
    <div class="sig-title">Employee Signature</div>
    <div class="sig-title">Date: ___________</div>
  </div>
</div>
<div class="footer-note">This is a computer-generated document. | {{company}}</div>
</body></html>`;

// ============================================================
// 5. CONFIRMATION LETTER
// ============================================================
export const confirmationLetterPDF = (data) => `<!DOCTYPE html>
<html><head><meta charset="utf-8">${pdfStyles}</head><body>
<div class="watermark">{{company}}</div>
<div class="header">
  <p class="company-name">{{company}}</p>
  <p class="company-sub">{{company_address}}</p>
</div>
<div class="doc-title">Confirmation Letter</div>
<div class="ref-date">
  <span>Ref No: CONF/{{employee_id}}/{{year}}</span>
  <span>Date: {{issued_date}}</span>
</div>
<p class="salutation">Dear {{full_name}},</p>
<p>We are pleased to inform you that you have successfully completed your probationary period at <strong>{{company}}</strong>. Your performance, dedication, and professionalism during this period have been commendable.</p>
<p>We are delighted to confirm your appointment as a <strong>Permanent Employee</strong> effective <strong>{{confirmation_date}}</strong>.</p>
<table class="terms-table">
  <tr><th colspan="2">Confirmation Details</th></tr>
  <tr><td>Employee ID</td><td>{{employee_id}}</td></tr>
  <tr><td>Full Name</td><td>{{full_name}}</td></tr>
  <tr><td>Designation</td><td>{{role_name}}</td></tr>
  <tr><td>Department</td><td>{{department}}</td></tr>
  <tr><td>Date of Joining</td><td>{{joining_date}}</td></tr>
  <tr><td>Probation Completion Date</td><td>{{trial_end}}</td></tr>
  <tr><td>Confirmation Date</td><td>{{confirmation_date}}</td></tr>
  <tr><td>Revised Annual CTC</td><td>{{revised_ctc}}</td></tr>
  <tr><td>Notice Period</td><td>{{notice_period}} days</td></tr>
</table>
<p>As a confirmed employee, you are entitled to the following benefits effective from your confirmation date:</p>
<ul>
  <li>Provident Fund (PF) as per statutory requirements</li>
  <li>Health Insurance coverage as per company policy</li>
  <li>Annual paid leaves as per company leave policy</li>
  <li>Annual performance appraisal</li>
</ul>
<p>Your continued employment is subject to adherence to company policies and satisfactory performance.</p>
<p>Congratulations on your confirmation! We look forward to your continued contributions to the growth of {{company}}.</p>
<div class="signature-block">
  <div class="sig-col">
    <div class="sig-line"></div>
    <div class="sig-name">{{hr_name}}</div>
    <div class="sig-title">HR Manager, {{company}}</div>
    <div class="sig-title">Date: {{issued_date}}</div>
  </div>
  <div class="sig-col">
    <div class="stamp-area">Company<br>Seal / Stamp</div>
  </div>
  <div class="sig-col">
    <div class="sig-line"></div>
    <div class="sig-name">{{full_name}}</div>
    <div class="sig-title">Employee Signature</div>
    <div class="sig-title">Date: ___________</div>
  </div>
</div>
<div class="footer-note">This is a computer-generated document. | {{company}} | {{company_address}}</div>
</body></html>`;

// ============================================================
// 6. TERMINATION LETTER
// ============================================================
export const terminationLetterPDF = (data) => `<!DOCTYPE html>
<html><head><meta charset="utf-8">${pdfStyles}</head><body>
<div class="header">
  <p class="company-name">{{company}}</p>
  <p class="company-sub">{{company_address}}</p>
</div>
<div class="doc-title">Termination Letter</div>
<div class="ref-date">
  <span>Ref No: TERM/{{employee_id}}/{{year}}</span>
  <span>Date: {{issued_date}}</span>
</div>
<p class="salutation">Dear {{full_name}},</p>
<p>This letter serves as official notice that your employment with <strong>{{company}}</strong> as <strong>{{role_name}}</strong> is terminated effective <strong>{{last_working_day}}</strong>.</p>
<table class="terms-table">
  <tr><td>Employee ID</td><td>{{employee_id}}</td></tr>
  <tr><td>Designation</td><td>{{role_name}}</td></tr>
  <tr><td>Date of Joining</td><td>{{joining_date}}</td></tr>
  <tr><td>Last Working Day</td><td>{{last_working_day}}</td></tr>
  <tr><td>Reason</td><td>{{termination_reason}}</td></tr>
</table>
<p>You are required to complete the following before your last working day:</p>
<ul>
  <li>Return all company property (laptop, ID card, access cards, etc.)</li>
  <li>Complete handover of all pending work and responsibilities</li>
  <li>Settle any outstanding dues with the company</li>
</ul>
<p>Your final settlement including salary up to last working day will be processed within 7 working days. The company will provide your Experience Letter separately.</p>
<p>This letter is issued without prejudice to any other rights and remedies the company may have.</p>
<div class="signature-block">
  <div class="sig-col">
    <div class="sig-line"></div>
    <div class="sig-name">{{hr_name}}</div>
    <div class="sig-title">HR Manager, {{company}}</div>
  </div>
  <div class="sig-col">
    <div class="stamp-area">Company<br>Seal / Stamp</div>
  </div>
  <div class="sig-col">
    <div class="sig-line"></div>
    <div class="sig-name">{{full_name}}</div>
    <div class="sig-title">Received By</div>
    <div class="sig-title">Date: ___________</div>
  </div>
</div>
<div class="footer-note">This is a computer-generated document. | {{company}}</div>
</body></html>`;

// ============================================================
// 7. EXPERIENCE LETTER
// ============================================================
export const experienceLetterPDF = (data) => `<!DOCTYPE html>
<html><head><meta charset="utf-8">${pdfStyles}</head><body>
<div class="watermark">{{company}}</div>
<div class="header">
  <p class="company-name">{{company}}</p>
  <p class="company-sub">{{company_address}}</p>
</div>
<div class="doc-title">Experience Letter</div>
<div class="ref-date">
  <span>Ref No: EXP/{{employee_id}}/{{year}}</span>
  <span>Date: {{issued_date}}</span>
</div>
<p><strong>To Whomsoever It May Concern</strong></p>
<p>This is to certify that <strong>{{full_name}}</strong> was employed with <strong>{{company}}</strong> from <strong>{{joining_date}}</strong> to <strong>{{last_working_day}}</strong> as <strong>{{role_name}}</strong> in the <strong>{{department}}</strong> department.</p>
<table class="terms-table">
  <tr><td>Employee ID</td><td>{{employee_id}}</td></tr>
  <tr><td>Name</td><td>{{full_name}}</td></tr>
  <tr><td>Designation</td><td>{{role_name}}</td></tr>
  <tr><td>Department</td><td>{{department}}</td></tr>
  <tr><td>Date of Joining</td><td>{{joining_date}}</td></tr>
  <tr><td>Last Date of Working</td><td>{{last_working_day}}</td></tr>
  <tr><td>Total Experience</td><td>{{tenure}}</td></tr>
</table>
<p>During their tenure, {{full_name}} demonstrated {{conduct_statement}}. They have discharged their duties with dedication and professionalism.</p>
<p>We wish {{full_name}} all the best in their future endeavours.</p>
<div class="signature-block">
  <div class="sig-col">
    <div class="sig-line"></div>
    <div class="sig-name">{{hr_name}}</div>
    <div class="sig-title">HR Manager, {{company}}</div>
    <div class="sig-title">Date: {{issued_date}}</div>
  </div>
  <div class="sig-col">
    <div class="stamp-area">Company<br>Seal / Stamp</div>
  </div>
</div>
<div class="footer-note">This is a computer-generated document. | {{company}} | {{company_address}}</div>
</body></html>`;

// ============================================================
// 8. RELIEVING LETTER
// ============================================================
export const relievingLetterPDF = (data) => `<!DOCTYPE html>
<html><head><meta charset="utf-8">${pdfStyles}</head><body>
<div class="watermark">{{company}}</div>
<div class="header">
  <p class="company-name">{{company}}</p>
  <p class="company-sub">{{company_address}}</p>
</div>
<div class="doc-title">Relieving Letter</div>
<div class="ref-date">
  <span>Ref No: REL/{{employee_id}}/{{year}}</span>
  <span>Date: {{issued_date}}</span>
</div>
<p><strong>To Whomsoever It May Concern</strong></p>
<p>This is to certify that <strong>{{full_name}}</strong> (Employee ID: {{employee_id}}) has been relieved from the services of <strong>{{company}}</strong> with effect from <strong>{{last_working_day}}</strong>.</p>
<p>{{full_name}} served as <strong>{{role_name}}</strong> in the <strong>{{department}}</strong> department from <strong>{{joining_date}}</strong> to <strong>{{last_working_day}}</strong>.</p>
<p>We confirm that {{full_name}} has been relieved of all duties and responsibilities as of the above date and has no dues pending with the company. All company assets have been returned.</p>
<p>We wish {{full_name}} the very best in their future career pursuits.</p>
<div class="signature-block">
  <div class="sig-col">
    <div class="sig-line"></div>
    <div class="sig-name">{{hr_name}}</div>
    <div class="sig-title">HR Manager, {{company}}</div>
    <div class="sig-title">Date: {{issued_date}}</div>
  </div>
  <div class="sig-col">
    <div class="stamp-area">Company<br>Seal / Stamp</div>
  </div>
</div>
<div class="footer-note">This is a computer-generated document. | {{company}} | {{company_address}}</div>
</body></html>`;
