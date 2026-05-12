import { supabase } from '../config/supabase.js';
import * as email from './emailService.js';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';

/**
 * Provisions a new user account for an employee.
 * Creates entry in Supabase Auth and the 'users' table.
 * Sends welcome email with credentials.
 */
export async function provisionEmployeeAccount(candidate) {
  // 1. Generate professional company email
  // Format: firstname+lastname.neluadventures@gmail.com
  const cleanName = candidate.full_name.toLowerCase().replace(/\s+/g, '+');
  const companyEmail = `${cleanName}.neluadventures@gmail.com`;
  
  const tempPassword = crypto.randomBytes(4).toString('hex') + '@Nelu2024'; 
  
  logger.info(`Provisioning corporate account: ${companyEmail} for ${candidate.full_name}`);

  // 2. Create in Supabase Auth using the NEW corporate email
  let userId;
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: companyEmail,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { 
      full_name: candidate.full_name,
      employee_id: candidate.employee_id,
      personal_email: candidate.email // keep for reference
    }
  });

  if (authError) {
    const isAlreadyRegistered = authError.message?.toLowerCase().includes('already registered') || 
                                authError.status === 422;

    if (isAlreadyRegistered) {
       logger.warn(`Corporate email ${companyEmail} already exists. Resyncing profile.`);
       // Fetch existing user to get their ID
       const { data: listData } = await supabase.auth.admin.listUsers();
       const foundUser = listData?.users?.find(u => u.email === companyEmail);
       
       if (foundUser) {
         userId = foundUser.id;
         logger.info(`Found existing user ID: ${userId}. Syncing password and profile.`);
         // Update their password to the new temporary one so they can log in
         await supabase.auth.admin.updateUserById(userId, { password: tempPassword });
       } else {
         throw new Error(`Auth says user exists but listUsers could not find them for ${companyEmail}`);
       }
    } else {
       throw authError;
    }
  } else {
    userId = authData?.user?.id;
  }

  // 3. Create/Update in our 'users' table (Atomic Force-Sync)
  if (userId) {
    logger.info(`Force-syncing 'users' table for ${companyEmail} (ID: ${userId})`);
    const { error: upsertError } = await supabase.from('users').upsert({
      id: userId,
      email: companyEmail,
      name: candidate.full_name,
      role: 'hr', // Using 'hr' for compatibility with current DB constraints
      employee_id: candidate.employee_id
    });

    if (upsertError) {
      logger.error(`Database Sync Failed: ${upsertError.message}`);
      throw new Error(`Profile sync failed: ${upsertError.message}`);
    }
    logger.info(`Database Sync Success for ${companyEmail}`);
  }

  // 4. Send credentials to their PERSONAL email
  await email.sendEmployeeWelcome(candidate, companyEmail, tempPassword);

  return { success: true, userId, companyEmail, tempPassword };
}
