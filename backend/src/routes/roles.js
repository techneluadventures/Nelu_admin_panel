import { Router }     from 'express';
import { verifyJWT }  from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { supabase }   from '../config/supabase.js';

export const rolesRouter = Router();

// GET /api/roles — all authenticated users
rolesRouter.get('/', verifyJWT, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('roles').select('*').order('role_name');
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

// POST /api/roles — admin only
// Body: { role_name, department, type }
rolesRouter.post('/', verifyJWT, requireRole('admin'), async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('roles').insert(req.body).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { next(err); }
});

// DELETE /api/roles/:id — admin only
rolesRouter.delete('/:id', verifyJWT, requireRole('admin'), async (req, res, next) => {
  try {
    const { error } = await supabase.from('roles').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Role deleted' });
  } catch (err) { next(err); }
});
