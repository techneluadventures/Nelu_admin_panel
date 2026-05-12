import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { supabase } from '../config/supabase.js';

export const auditRouter = Router();

// GET /api/audit — admin only, all audit logs
auditRouter.get('/', verifyJWT, requireRole('admin'), async (req, res, next) => {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*, users(name, email)')
      .order('timestamp', { ascending: false })
      .limit(500);

    if (req.query.entity_id) query = query.eq('entity_id', req.query.entity_id);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/audit/errors — failed jobs
auditRouter.get('/errors', verifyJWT, requireRole('admin'), async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('error_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

// POST /api/audit/retry/:id — manually retry a failed job
import * as workflow from '../services/workflowService.js';
auditRouter.post('/retry/:id', verifyJWT, requireRole('admin'), async (req, res, next) => {
  try {
    const result = await workflow.retryJob(req.params.id);
    res.json(result);
  } catch (err) { next(err); }
});


// GET /api/audit/emails — email history
auditRouter.get('/emails', verifyJWT, requireRole('hr', 'admin'), async (req, res, next) => {
  try {
    let query = supabase
      .from('email_logs')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(200);
    if (req.query.candidate_id) query = query.eq('candidate_id', req.query.candidate_id);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});
