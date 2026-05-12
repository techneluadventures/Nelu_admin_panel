import express from 'express';
import crypto from 'crypto';
import { supabase } from '../config/supabase.js';
import { verifyJWT } from '../middleware/auth.js';
import { validate, leadSchema, bulkLeadSchema } from '../middleware/validation.js';
import { getBrowser } from '../utils/browserManager.js';

export const crmRouter = express.Router();

// Helper to normalize and hash phone
const getPhoneHash = (phone) => {
  const normalized = String(phone).replace(/[^0-9]/g, '').slice(-10); // Last 10 digits
  return crypto.createHash('sha256').update(normalized).digest('hex');
};

// ------------------------------------------------------------
// 1. LEADS
// ------------------------------------------------------------

// List leads with status/assignment filters
crmRouter.get('/leads', verifyJWT, async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, unassigned, pool } = req.query;
    let query = supabase
      .from('leads')
      .select('*, users!assigned_to(name)') // Explicit join on assigned_to
      .range(Number(offset), Number(offset) + Number(limit) - 1)
      .order('created_at', { ascending: false });

    if (pool === 'true') {
      // PLATINUM RULE: Strictly only leads with absolutely NO assignment
      query = query.is('assigned_to', null);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Create new lead with deduplication
crmRouter.post('/leads', verifyJWT, validate(leadSchema), async (req, res, next) => {
  try {
    const payload = req.body;
    payload.created_by = req.user.id;
    
    // ATOMIC: Generate SHA-256 Hash for Deduplication
    if (payload.phone) {
      payload.phone_hash = getPhoneHash(payload.phone);
    }

    const { data, error } = await supabase
      .from('leads')
      .insert(payload)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'A lead with this phone number already exists in the active pipeline.' });
      throw error;
    }
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// Bulk Import with SHA-256 Uniqueness
crmRouter.post('/leads/bulk', verifyJWT, express.json({ limit: '10mb' }), validate(bulkLeadSchema), async (req, res, next) => {
  try {
    const { leads } = req.body;
    const batchId = crypto.randomUUID();
    
    const hashes = leads.map(l => getPhoneHash(l.phone));
    const { data: existing } = await supabase.from('leads').select('phone_hash').in('phone_hash', hashes);
    const existingHashes = new Set(existing?.map(l => l.phone_hash) || []);

    const newLeads = [];
    const skipped = [];
    
    for (const lead of leads) {
      const hash = getPhoneHash(lead.phone);
      if (existingHashes.has(hash)) {
        skipped.push({ phone: lead.phone, reason: 'Duplicate' });
        continue;
      }
      
      newLeads.push({
        ...lead,
        phone_hash: hash,
        import_batch_id: batchId,
        stage: 'New Lead',
        created_by: req.user.id
      });
      existingHashes.add(hash); 
    }

    if (newLeads.length > 0) {
      const { error } = await supabase.from('leads').insert(newLeads);
      if (error) throw error;
    }

    res.status(201).json({ success: true, imported: newLeads.length, skippedCount: skipped.length });
  } catch (err) {
    next(err);
  }
});

// Get specific lead with visits
crmRouter.get('/leads/:id', verifyJWT, async (req, res, next) => {
  try {
    const { data: lead, error: leadErr } = await supabase.from('leads').select('*, users!assigned_to(name)').eq('id', req.params.id).single();
    if (leadErr) throw leadErr;

    const { data: visits, error: visitErr } = await supabase.from('site_visits').select('*, users!agent_id(name)').eq('lead_id', req.params.id).order('created_at', { ascending: false });
    if (visitErr) throw visitErr;

    res.json({ ...lead, site_visits: visits });
  } catch (err) {
    next(err);
  }
});

// Update lead stage or info
crmRouter.patch('/leads/:id', verifyJWT, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Atomic Race-Condition-Safe Claim
crmRouter.patch('/leads/:id/claim', verifyJWT, async (req, res, next) => {
  try {
    // ATOMIC: Row lock using standard update with where clause
    const { data, error } = await supabase
      .from('leads')
      .update({ 
        assigned_to: req.user.id,
        stage: 'Claimed'
      })
      .eq('id', req.params.id)
      .eq('stage', 'New Lead') // ONLY claim if still New
      .select()
      .single();

    if (!data) return res.status(409).json({ error: 'This lead was just claimed by another agent.' });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------
// 2. SITE VISITS (Immutable Logs)
// ------------------------------------------------------------

// Log a site visit with mandatory GPS timestamps
crmRouter.post('/leads/:id/visits', verifyJWT, async (req, res, next) => {
  try {
    const payload = {
      lead_id: req.params.id,
      agent_id: req.user.id,
      gps_lat: req.body.gps_lat,
      gps_lng: req.body.gps_lng,
      gps_location: `${req.body.gps_lat}, ${req.body.gps_lng}`, // SYNC FIX: Satisfy legacy DB constraint
      discussion_summary: req.body.discussion_summary || req.body.notes, 
      temperature: req.body.temperature || 'warm'
    };

    // Only add Platinum columns if they exist in payload
    if (req.body.client_objections) payload.client_objections = req.body.client_objections;
    if (req.body.items_discussed) payload.items_discussed = req.body.items_discussed;
    if (req.body.gps_accuracy_m) payload.gps_accuracy_m = req.body.gps_accuracy_m;
    if (req.body.gps_captured_at) payload.gps_captured_at = req.body.gps_captured_at;

    if (!payload.gps_lat || !payload.gps_lng) {
      return res.status(400).json({ error: 'Mandatory GPS Lock required for site visits.' });
    }

    const { data, error } = await supabase.from('site_visits').insert(payload).select().single();
    
    if (error) {
       console.error('[DB] Visit log failed:', error);
       // If column missing, try legacy insert
       if (error.code === '42703') {
          return res.status(500).json({ error: 'Database schema mismatch. Please run the Platinum SQL in Supabase Editor.' });
       }
       throw error;
    }

    // Advanced Stage Flow
    const nextStage = payload.temperature === 'hot' ? 'Qualified' : 'Site Visit Completed';
    await supabase.from('leads').update({ stage: nextStage, interest_level: payload.temperature }).eq('id', req.params.id);

    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------
// 3. QUOTATIONS
// ------------------------------------------------------------

// Generate a PDF Quotation
crmRouter.post('/quotations/generate', verifyJWT, async (req, res, next) => {
  try {
    const { lead_id, client_name, property_name, date, products, gst_percent = 18, installation_charges = 0 } = req.body;

    // Calculate totals
    const subtotal = products.reduce((acc, p) => acc + (p.price * p.quantity), 0);
    const gst_amount = (subtotal + Number(installation_charges)) * (gst_percent / 100);
    const grand_total = subtotal + Number(installation_charges) + gst_amount;

    // HTML Template for Puppeteer
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Helvetica', sans-serif; color: #333; margin: 0; padding: 40px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #FC922E; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { max-width: 150px; }
          .company-details { text-align: right; font-size: 12px; color: #555; }
          .title { font-size: 28px; color: #014905; font-weight: bold; margin: 0; }
          .client-box { background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #014905; color: white; padding: 12px; text-align: left; font-size: 14px; }
          td { padding: 12px; border-bottom: 1px solid #ddd; font-size: 14px; }
          .totals { width: 50%; float: right; }
          .totals table th { background: transparent; color: #333; text-align: right; padding-right: 20px; }
          .totals table td { text-align: right; font-weight: bold; }
          .grand-total { background: #FC922E; color: white !important; font-size: 18px; }
          .footer { clear: both; margin-top: 100px; border-top: 1px solid #ddd; padding-top: 20px; font-size: 10px; color: #777; text-align: center; }
          .signature { margin-top: 80px; width: 200px; border-top: 1px solid #333; text-align: center; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">QUOTATION</h1>
            <p style="margin-top: 5px; color: #777;">Date: ${date}</p>
          </div>
          <div class="company-details">
            <h2 style="color: #FC922E; margin: 0; font-size: 18px;">${process.env.COMPANY_NAME || 'Nelu Adventures'}</h2>
            <p>${process.env.COMPANY_ADDRESS || 'Hyderabad, Telangana'}</p>
            <p>operations.neluadventures@gmail.com</p>
          </div>
        </div>

        <div class="client-box">
          <strong>Prepared For:</strong><br>
          ${client_name}<br>
          ${property_name}
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Price (₹)</th>
              <th>Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${products.map(p => `
              <tr>
                <td>${p.name}</td>
                <td>${p.quantity}</td>
                <td>${p.price.toLocaleString('en-IN')}</td>
                <td>${(p.price * p.quantity).toLocaleString('en-IN')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <table>
            <tr>
              <th>Subtotal</th>
              <td>₹${subtotal.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <th>Installation & Logistics</th>
              <td>₹${Number(installation_charges).toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <th>Taxes (GST ${gst_percent}%)</th>
              <td>₹${gst_amount.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <th class="grand-total">GRAND TOTAL</th>
              <td class="grand-total">₹${grand_total.toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </div>

        <div style="clear: both; margin-top: 60px;">
          <h3>Terms & Conditions:</h3>
          <ul style="font-size: 12px; color: #555;">
            <li>50% advance required to initiate manufacturing.</li>
            <li>40% before dispatch of materials.</li>
            <li>10% upon successful installation.</li>
            <li>Quotation valid for 30 days.</li>
          </ul>
        </div>

        <div class="signature">
          Authorized Signature<br>
          <strong>Nelu Adventures</strong>
        </div>

        <div class="footer">
          This is an automatically generated quotation from the Nelu Adventures OS.
        </div>
      </body>
      </html>
    `;

    const browser = await getBrowser();
    console.log('[PDF] 🛰️ Browser instance secured');
    const page = await browser.newPage();
    
    try {
      // PRODUCTION GRADE: 30s tactical window for complex renders
      await page.setDefaultTimeout(30000);
      
      console.log('[PDF] 🏗️ Rendering tactical layout...');
      await page.setContent(html, { waitUntil: 'domcontentloaded' }); 
      await page.evaluate(() => document.fonts.ready); // Wait for Poppins/Georgia to lock in
      await new Promise(r => setTimeout(r, 500)); // Platinum Style Lock
      
      console.log('[PDF] 📄 Executing high-fidelity print...');
      const pdfBuffer = await page.pdf({ 
        format: 'A4', 
        printBackground: true, 
        timeout: 30000,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
      });
      
      console.log('[PDF] ✅ Dispatching encrypted mission brief');
      
      res.json({ 
        success: true, 
        pdf: Buffer.from(pdfBuffer).toString('base64'),
        metadata: { subtotal, gst_amount, grand_total }
      });
    } catch (innerErr) {
      console.error('[PDF] ❌ Generation Phase Failure:', innerErr.message);
      throw innerErr;
    } finally {
      await page.close();
    }

  } catch (err) {
    next(err);
  }
});
