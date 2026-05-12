import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
  const tables = ['users', 'roles', 'candidates', 'documents', 'issued_letters', 'leads', 'site_visits', 'quotations', 'workflow_events', 'audit_logs', 'email_logs'];
  const report = {};

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        report[table] = { status: 'error', message: error.message };
      } else {
        report[table] = { status: 'exists', columns: data.length > 0 ? Object.keys(data[0]) : 'exists_but_empty' };
      }
    } catch (e) {
      report[table] = { status: 'not_found', message: e.message };
    }
  }

  console.log(JSON.stringify(report, null, 2));
}

inspect();
