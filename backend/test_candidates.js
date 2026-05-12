import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('candidates').select('*').order('created_at', { ascending: false }).limit(5);
  console.log('Candidates:', data);
  console.log('Error:', error);
}

check();
