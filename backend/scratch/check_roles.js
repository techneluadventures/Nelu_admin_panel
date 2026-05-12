import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkRoles() {
  const { data, error } = await supabase.from('roles').select('*');
  console.log('Roles:', data);
  if (error) console.error(error);
}

checkRoles();
