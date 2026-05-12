import { Router }   from 'express';
import { verifyJWT } from '../middleware/auth.js';
import { supabase }  from '../config/supabase.js';

export const workflow = Router();

// GET /api/workflow/:candidateId
// Get the full timeline of events for a candidate
workflow.get('/:candidateId', verifyJWT, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('workflow_events')
      .select('*')
      .eq('candidate_id', req.params.candidateId)
      .order('timestamp', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});
