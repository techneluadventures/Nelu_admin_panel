import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkUserRoles() {
  const { data, error } = await supabase.from('users').select('role');
  if (error) {
     console.error(error);
     return;
  }
  const roles = [...new Set(data.map(u => u.role))];
  console.log('Unique Roles in users table:', roles);
}

checkUserRoles();
