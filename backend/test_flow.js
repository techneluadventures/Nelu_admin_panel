import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

async function runTests() {
  const adminId = '3b5da0d5-761b-4df0-9246-fe29db59a6ab';

  // Find the candidate we just created
  const { data: candidates } = await supabase.from('candidates').select('*').eq('email', 'ajay.neluadventures@gmail.com').order('created_at', { ascending: false });
  if (!candidates || candidates.length === 0) {
    console.log("No candidate found");
    return;
  }
  const candidate = candidates[0];
  const id = candidate.id;
  console.log('Testing candidate:', id);

  // Fetch token via login
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ajay.neluadventures@gmail.com', password: 'Demo@123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;

  // Helper to make API calls directly to local backend
  const fetchAPI = async (method, path, body) => {
    const res = await fetch(`http://localhost:3001/api/candidates/${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) {
      console.error(`API Error ${path}:`, await res.text());
      throw new Error(`API Error ${path}`);
    }
    return res.json();
  };

  try {
    console.log('\\n=== FETCH CANDIDATE ===');
    const getRes = await fetchAPI('GET', id);
    console.log('Candidate fetch:', getRes.id);

    /*
    console.log('\\n=== PHASE 3: INTERVIEW ===');
    let res = await fetchAPI('PATCH', `${id}/shortlist`, {
      interview_at: new Date(Date.now() + 86400000).toISOString(),
      interview_mode: 'online',
      interview_link: 'https://meet.google.com/test-link'
    });
    console.log('Shortlisted:', res.status);
    
    // Check emails and workflow events
    let { data: emails } = await supabase.from('email_logs').select('*').eq('candidate_id', id);
    console.log('Emails sent count:', emails.length, emails.map(e => e.type));
    
    res = await fetchAPI('PATCH', `${id}/status`, { status: 'interview_done' });
    console.log('Interview Done:', res.status);
    
    res = await fetchAPI('PATCH', `${id}/status`, { status: 'selected' });
    console.log('Selected:', res.status);

    console.log('\\n=== PHASE 4: OFFER ===');
    res = await fetchAPI('PATCH', `${id}/offer`, {
      ctc: 'Rs 50000 per month',
      joining_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      probation_months: 3,
      offer_deadline: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
    });
    console.log('Offer Sent:', res.status);
    
    // Wait for async pdf generation and email
    await new Promise(r => setTimeout(r, 3000));
    
    // Check issued letters
    let { data: letters } = await supabase.from('issued_letters').select('*').eq('candidate_id', id);
    console.log('Issued Letters:', letters.map(l => l.type + ' ' + (l.pdf_url ? 'Has PDF' : 'No PDF')));

    // Accept Offer
    res = await fetchAPI('POST', `portal/${candidate.unique_token}/respond`, { action: 'accept' });
    console.log('Offer Accepted:', res.status);
    */
    let res;

    /*
    console.log('\\n=== PHASE 5: TRIAL ===');
    res = await fetchAPI('PATCH', `${id}/status`, { status: 'pre_boarding' });
    console.log('Pre-boarding:', res.status);

    res = await fetchAPI('PATCH', `${id}/trial`, {
      trial_start: new Date().toISOString().split('T')[0],
      trial_end: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]
    });
    console.log('Trial Started:', res.status);
    
    await new Promise(r => setTimeout(r, 3000));
    let { data: letters } = await supabase.from('issued_letters').select('*').eq('candidate_id', id);
    console.log('Issued Letters:', letters.map(l => l.type + ' ' + (l.pdf_url ? 'Has PDF' : 'No PDF')));
    */
    let letters;

    console.log('\\n=== PHASE 6: DOCS ===');
    res = await fetchAPI('PATCH', `${id}/status`, { status: 'docs_pending' });
    console.log('Docs Pending:', res.status);

    // Simulate doc verification directly in DB since upload is multipart
    await supabase.from('candidates').update({ status: 'docs_verified' }).eq('id', id);
    console.log('Docs Verified: manually simulated');

    console.log('\\n=== PHASE 7: CONFIRMATION ===');
    res = await fetchAPI('PATCH', `${id}/confirm`);
    console.log('Confirmed:', res.status); // Wait, this actually sets it to active in backend route

    await new Promise(r => setTimeout(r, 3000));
    letters = (await supabase.from('issued_letters').select('*').eq('candidate_id', id)).data;
    console.log('Issued Letters:', letters.map(l => l.type + ' ' + (l.pdf_url ? 'Has PDF' : 'No PDF')));

    console.log('\\n=== PHASE 8: EXIT ===');
    res = await fetchAPI('PATCH', `${id}/resign`, {
      resignation_date: new Date().toISOString().split('T')[0],
      last_working_day: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
    });
    console.log('Resigned:', res.status);

    res = await fetchAPI('PATCH', `${id}/offboard`);
    console.log('Offboarded:', res.status);

    await new Promise(r => setTimeout(r, 4000));
    letters = (await supabase.from('issued_letters').select('*').eq('candidate_id', id)).data;
    console.log('Issued Letters:', letters.map(l => l.type + ' ' + (l.pdf_url ? 'Has PDF' : 'No PDF')));

    emails = (await supabase.from('email_logs').select('*').eq('candidate_id', id)).data;
    console.log('\\nAll emails sent:', emails.map(e => e.type));

    let { data: events } = await supabase.from('workflow_events').select('*').eq('candidate_id', id);
    console.log('Workflow events count:', events.length);

  } catch (err) {
    console.error('Test failed:', err);
  }
}

runTests();
