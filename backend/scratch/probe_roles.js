import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkConstraints() {
  // Querying the RPC if exists, or using a raw SQL approach if possible
  // Since we can't run raw SQL easily via Supabase Client without a function,
  // we will try to "probe" the constraint by inserting different values.
  
  const testRoles = ['user', 'staff', 'member', 'hr', 'employee', 'operations'];
  for (const role of testRoles) {
    console.log(`Probing role: ${role}...`);
    const { error } = await supabase.from('users').insert({
       id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
       email: `test_${role}@test.com`,
       name: 'Test',
       role: role
    });
    if (error && error.message.includes('check constraint')) {
       console.log(`  ❌ Rejected: ${role}`);
    } else if (error) {
       console.log(`  ❓ Other Error for ${role}: ${error.message}`);
    } else {
       console.log(`  ✅ Accepted: ${role}`);
       // Clean up
       await supabase.from('users').delete().eq('email', `test_${role}@test.com`);
    }
  }
}

checkConstraints();
