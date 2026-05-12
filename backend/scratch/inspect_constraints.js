import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectConstraints() {
  const { data, error } = await supabase.rpc('get_table_constraints', { t_name: 'documents' });
  if (error) {
     // If RPC doesn't exist, try a direct query via information_schema
     const { data: data2, error: error2 } = await supabase
       .from('information_schema.table_constraints')
       .select('constraint_name, constraint_type')
       .eq('table_name', 'documents');
     console.log(JSON.stringify(data2 || error2, null, 2));
  } else {
     console.log(JSON.stringify(data, null, 2));
  }
}

inspectConstraints();
