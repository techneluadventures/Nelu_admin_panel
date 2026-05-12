import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.from('audit_logs').insert({
    user_id: '3b5da0d5-761b-4df0-9246-fe29db59a6ab',
    action: 'test',
    entity_type: 'test',
    entity_id: '3b5da0d5-761b-4df0-9246-fe29db59a6ab'
  });
  console.log('Error:', error);
  console.log('Data:', data);
}

test();
