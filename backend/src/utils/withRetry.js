// Wraps any async fn with exponential backoff + error logging
import { supabase } from '../config/supabase.js';

export async function withRetry(fn, { service, entityId = null, payload = null, maxAttempts = 3 } = {}) {
  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt >= maxAttempts) {
        // Log the final failure to the DB for the "Try Again" feature
        await supabase.from('error_logs').insert({
          service, 
          message: err.message,
          retry_count: attempt, 
          status: 'dead',
          entity_id: entityId,
          payload: payload ? JSON.stringify(payload) : null,
          timestamp: new Date().toISOString()
        });
        throw err;
      }
      await sleep(2 ** attempt * 500); // 1s, 2s, 4s…
    }
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
