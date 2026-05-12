import { supabase } from '../config/supabase.js';

// Call this inside every service function that changes data.
// It creates a permanent record of who did what and when.
// userId  = the HR/Admin user doing the action
// action  = e.g. 'candidate.invited', 'document.verified'
// entity  = the table name, e.g. 'candidates'
// entityId = the UUID of the record being changed

export async function auditLog(userId, action, entity, entityId) {
  const { error } = await supabase.from('audit_logs').insert({
    actor_id:    userId,
    action,
    entity_type: entity,
    entity_id:   entityId,
  });

  // Audit logging should never crash the main operation
  if (error) console.error('[AUDIT LOG FAILED]', error.message);
}
