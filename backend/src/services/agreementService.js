import puppeteer  from 'puppeteer';
import { supabase } from '../config/supabase.js';
import * as drive   from './driveService.js';

export async function generate(candidate) {
  // 1. Fetch latest template version for this role
  const { data: tpl } = await supabase
    .from('templates')
    .select('*')
    .eq('role_id', candidate.role_id)
    .eq('type', 'agreement')
    .order('version', { ascending: false })
    .limit(1)
    .single();

  // 2. Render HTML template with candidate data
  const html = await renderTemplate(tpl.file_url, candidate);

  // 3. Generate PDF with Puppeteer
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page    = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdf  = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();

  // 4. Upload PDF to Google Drive
  const driveUrl = await drive.uploadPdf(
    pdf, `agreement_${candidate.id}.pdf`
  );

  // 5. Save agreement record
  const { data } = await supabase.from('agreements').insert({
    candidate_id: candidate.id,
    template_id:  tpl.id,
    pdf_url:      driveUrl,
    status:       'sent'
  }).select().single();

  return data;
}

async function renderTemplate(fileUrl, candidate) {
  const res  = await fetch(fileUrl);
  let   html = await res.text();
  // Replace {{full_name}}, {{role}}, {{date}} tokens
  return html
    .replaceAll('{{full_name}}', candidate.full_name)
    .replaceAll('{{role}}',      candidate.role_name)
    .replaceAll('{{date}}',      new Date().toLocaleDateString('en-IN'));
}
