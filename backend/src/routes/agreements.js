import { Router }     from 'express';
import { verifyJWT }  from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { supabase }   from '../config/supabase.js';
import * as svc       from '../services/agreementService.js';

export const agreements = Router();

// GET /api/agreements?candidate_id=uuid
// Get all agreements for a candidate
agreements.get('/', verifyJWT, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('agreements')
      .select('*, templates(type, version)')
      .eq('candidate_id', req.query.candidate_id)
      .order('generated_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

// POST /api/agreements/generate
// Manually trigger PDF generation for a candidate — HR and Admin only
// Body: { candidate_id: 'uuid' }
agreements.post('/generate', verifyJWT, requireRole('hr', 'admin'), async (req, res, next) => {
  try {
    const { data: candidate, error } = await supabase
      .from('candidates')
      .select('*, roles(role_name)')
      .eq('id', req.body.candidate_id)
      .single();

    if (error) throw error;

    const agreement = await svc.generate(candidate);
    res.status(201).json(agreement);
  } catch (err) { next(err); }
});

// PATCH /api/agreements/:id/status
// Update agreement status (e.g. to 'signed') — HR and Admin only
// Body: { status: 'signed' }
agreements.patch('/:id/status', verifyJWT, requireRole('hr', 'admin'), async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('agreements')
      .update({ status: req.body.status })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});
