// ============================================================
// NELU — PDF Generation Service
// Converts HTML templates to PDF using Puppeteer.
// Uploads to Google Drive. Returns download URL.
// ============================================================
import { supabase } from '../config/supabase.js';
import * as drive from './driveService.js';
import { getBrowser } from '../utils/browserManager.js';
import {
  offerLetterPDF,
  internshipOfferLetterPDF,
  appointmentLetterPDF,
  probationExtensionPDF,
  confirmationLetterPDF,
  terminationLetterPDF,
  experienceLetterPDF,
  relievingLetterPDF,
} from '../templates/pdfs/all_pdf_templates.js';

const COMPANY = process.env.COMPANY_NAME || 'Nelu Adventures';
const COMPANY_ADDRESS = process.env.COMPANY_ADDRESS || 'Company Address, City, State — PIN';
const HR_NAME = process.env.HR_MANAGER_NAME || 'HR Manager';

// ─── Fill all placeholders in HTML ───────────────────────────
function fill(html, data) {
  let result = html;
  const allData = { company: COMPANY, company_address: COMPANY_ADDRESS, hr_name: HR_NAME, year: new Date().getFullYear(), ...data };
  for (const [key, value] of Object.entries(allData)) {
    result = result.replaceAll(`{{${key}}}`, value ?? '');
  }
  return result;
}

// ─── Format date ─────────────────────────────────────────────
function fmt(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

// ─── Convert HTML to PDF Buffer using Puppeteer ──────────────
async function htmlToPdf(html) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
    });
    return pdf;
  } finally {
    await page.close();
  }
}

// ─── Generate PDF, upload to Drive, save record ──────────────
async function generateAndSave(candidateId, type, html, filename) {
  // 1. Generate PDF
  const pdfBuffer = await htmlToPdf(html);

  // 2. Upload to Google Drive
  const pdfUrl = await drive.uploadPdf(pdfBuffer, filename);

  // 3. Save record in issued_letters table
  await supabase.from('issued_letters').insert({
    candidate_id: candidateId,
    type,
    pdf_url: pdfUrl,
    status: 'generated',
  });

  return { pdfBuffer, pdfUrl };
}

// ============================================================
// Generate Offer Letter
// ============================================================
export async function generateOfferLetter(candidate) {
  const role = candidate.roles || {};
  const isInternship = role.type === 'internship';
  const template = isInternship ? internshipOfferLetterPDF : offerLetterPDF;
  const data = {
    ref_id: candidate.id.substring(0, 8).toUpperCase(),
    issued_date: fmt(new Date()),
    full_name: candidate.full_name,
    role_name: role.role_name || '—',
    department: role.department || '—',
    employment_type: isInternship ? 'Internship' : 'Full-Time Permanent',
    ctc: candidate.ctc || 'As discussed',
    probation_months: candidate.probation_months || 3,
    joining_date: fmt(candidate.joining_date),
    offer_deadline: fmt(candidate.offer_deadline),
    work_location: process.env.OFFICE_ADDRESS || 'Company Office',
    notice_period: '30',
    // Internship specific
    college_name: candidate.college_name || '—',
    internship_end_date: fmt(candidate.trial_end),
    duration: candidate.probation_months || 1,
    work_mode: 'In-Office',
    manager_name: process.env.DEFAULT_MANAGER_NAME || 'Reporting Manager',
  };

  const html = fill(template(), data);
  return generateAndSave(
    candidate.id,
    isInternship ? 'internship_offer_letter' : 'offer_letter',
    html,
    `Offer_Letter_${candidate.full_name.replace(/ /g, '_')}_${Date.now()}.pdf`
  );
}

// ============================================================
// Generate Appointment Letter (on joining day)
// ============================================================
export async function generateAppointmentLetter(candidate) {
  const role = candidate.roles || {};
  const data = {
    issued_date: fmt(new Date()),
    employee_id: candidate.employee_id || '—',
    full_name: candidate.full_name,
    role_name: role.role_name || '—',
    department: role.department || '—',
    joining_date: fmt(candidate.trial_start || candidate.joining_date),
    trial_end: fmt(candidate.trial_end),
    ctc: candidate.ctc || 'As per offer letter',
    probation_months: candidate.probation_months || 3,
    manager_name: process.env.DEFAULT_MANAGER_NAME || 'Reporting Manager',
    work_location: process.env.OFFICE_ADDRESS || 'Company Office',
    notice_period: '7',
  };

  const html = fill(appointmentLetterPDF(), data);
  return generateAndSave(
    candidate.id,
    'appointment_letter',
    html,
    `Appointment_Letter_${candidate.employee_id || candidate.id.substring(0, 8)}_${Date.now()}.pdf`
  );
}

// ============================================================
// Generate Probation Extension Letter
// ============================================================
export async function generateExtensionLetter(candidate, extensionData) {
  const data = {
    issued_date: fmt(new Date()),
    employee_id: candidate.employee_id || '—',
    full_name: candidate.full_name,
    role_name: candidate.roles?.role_name || '—',
    joining_date: fmt(candidate.trial_start),
    original_end_date: fmt(extensionData.originalEndDate),
    new_end_date: fmt(extensionData.newEndDate),
    extension_months: extensionData.extensionMonths,
    extension_reason: extensionData.reason,
  };

  const html = fill(probationExtensionPDF(), data);
  return generateAndSave(
    candidate.id,
    'trial_extension_letter',
    html,
    `Extension_Letter_${candidate.employee_id || candidate.id.substring(0, 8)}_${Date.now()}.pdf`
  );
}

// ============================================================
// Generate Confirmation Letter
// ============================================================
export async function generateConfirmationLetter(candidate) {
  const role = candidate.roles || {};
  const data = {
    issued_date: fmt(new Date()),
    employee_id: candidate.employee_id || '—',
    full_name: candidate.full_name,
    role_name: role.role_name || '—',
    department: role.department || '—',
    joining_date: fmt(candidate.trial_start),
    trial_end: fmt(candidate.trial_end),
    confirmation_date: fmt(new Date()),
    revised_ctc: candidate.ctc || 'As per revised letter',
    notice_period: '30',
  };

  const html = fill(confirmationLetterPDF(), data);
  return generateAndSave(
    candidate.id,
    'confirmation_letter',
    html,
    `Confirmation_Letter_${candidate.employee_id || candidate.id.substring(0, 8)}_${Date.now()}.pdf`
  );
}

// ============================================================
// Generate Termination Letter
// ============================================================
export async function generateTerminationLetter(candidate) {
  const data = {
    issued_date: fmt(new Date()),
    employee_id: candidate.employee_id || '—',
    full_name: candidate.full_name,
    role_name: candidate.roles?.role_name || '—',
    joining_date: fmt(candidate.trial_start),
    last_working_day: fmt(candidate.last_working_day),
    termination_reason: candidate.exit_reason || 'Unsatisfactory performance during probation period',
  };

  const html = fill(terminationLetterPDF(), data);
  return generateAndSave(
    candidate.id,
    'termination_letter',
    html,
    `Termination_Letter_${candidate.employee_id || candidate.id.substring(0, 8)}_${Date.now()}.pdf`
  );
}

// ============================================================
// Generate Experience Letter
// ============================================================
export async function generateExperienceLetter(candidate) {
  const role = candidate.roles || {};
  const joiningDate = new Date(candidate.trial_start || candidate.joining_date);
  const lastWorkingDay = new Date(candidate.last_working_day);
  const months = Math.round((lastWorkingDay - joiningDate) / (1000 * 60 * 60 * 24 * 30));
  const years = Math.floor(months / 12);
  const rem = months % 12;
  const tenure = years > 0
    ? `${years} year${years > 1 ? 's' : ''} ${rem > 0 ? `and ${rem} month${rem > 1 ? 's' : ''}` : ''}`
    : `${months} month${months > 1 ? 's' : ''}`;

  const data = {
    issued_date: fmt(new Date()),
    employee_id: candidate.employee_id || '—',
    full_name: candidate.full_name,
    role_name: role.role_name || '—',
    department: role.department || '—',
    joining_date: fmt(candidate.trial_start),
    last_working_day: fmt(candidate.last_working_day),
    tenure,
    conduct_statement: 'good conduct, sincerity, and a professional approach',
  };

  const html = fill(experienceLetterPDF(), data);
  return generateAndSave(
    candidate.id,
    'experience_letter',
    html,
    `Experience_Letter_${candidate.employee_id || candidate.id.substring(0, 8)}_${Date.now()}.pdf`
  );
}

// ============================================================
// Generate Relieving Letter
// ============================================================
export async function generateRelievingLetter(candidate) {
  const role = candidate.roles || {};
  const joiningDate = new Date(candidate.trial_start || candidate.joining_date);
  const lastWorkingDay = new Date(candidate.last_working_day);
  const months = Math.round((lastWorkingDay - joiningDate) / (1000 * 60 * 60 * 24 * 30));

  const data = {
    issued_date: fmt(new Date()),
    employee_id: candidate.employee_id || '—',
    full_name: candidate.full_name,
    role_name: role.role_name || '—',
    department: role.department || '—',
    joining_date: fmt(candidate.trial_start),
    last_working_day: fmt(candidate.last_working_day),
    tenure: `${months} month${months > 1 ? 's' : ''}`,
  };

  const html = fill(relievingLetterPDF(), data);
  return generateAndSave(
    candidate.id,
    'relieving_letter',
    html,
    `Relieving_Letter_${candidate.employee_id || candidate.id.substring(0, 8)}_${Date.now()}.pdf`
  );
}
