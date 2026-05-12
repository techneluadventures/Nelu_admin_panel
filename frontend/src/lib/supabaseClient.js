import { createClient } from '@supabase/supabase-js';

// Anon key only — safe for frontend
// Used ONLY for Auth (login/logout)
// All DB queries go through the backend API
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
