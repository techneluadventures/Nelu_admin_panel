import { createClient } from '@supabase/supabase-js';

// This client uses the ANON (public) key — safe for the frontend.
// It is used ONLY for Supabase Auth (login/logout).
// All database queries go through the backend API, never directly from here.

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
