import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function findTypes() {
  const { data, error } = await supabase.from('documents').select('type');
  if (error) {
    console.error(error);
    return;
  }
  const uniqueTypes = [...new Set(data.map(d => d.type))];
  console.log('Unique types in documents table:', uniqueTypes);
}

findTypes();
