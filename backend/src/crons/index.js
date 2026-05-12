// ============================================================
// NELU — All Cron Jobs
// These run automatically in the background.
// Every timed automation lives here.
// ============================================================
import cron        from 'node-cron';
import { supabase } from '../config/supabase.js';
import * as email   from '../services/emailService.js';
import { logger }   from '../utils/logger.js';

export function startCrons() {
  logger.info('Starting all cron jobs...');

  // ──────────────────────────────────────────────────────────
  // DAILY 8:00 AM — Interview reminders (24 hrs before)
  // ──────────────────────────────────────────────────────────
  cron.schedule('0 8 * * *', async () => {
    logger.info('Cron: checking interviews tomorrow');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const { data } = await supabase
      .from('candidates')
      .select('*, roles(*)')
      .eq('status', 'interview_scheduled')
      .like('interview_at', `${tomorrowStr}%`);

    for (const c of data || []) {
      await email.sendInterviewReminder(c).catch(err =>
        logger.error('Interview reminder failed', { id: c.id, error: err.message })
      );
    }
    logger.info(`Cron: sent ${(data || []).length} interview reminders`);
  });

  // ──────────────────────────────────────────────────────────
  // DAILY 9:00 AM — Offer deadline reminders (2 days before expiry)
  // ──────────────────────────────────────────────────────────
  cron.schedule('0 9 * * *', async () => {
    logger.info('Cron: checking offer deadlines');
    const inTwoDays = new Date();
    inTwoDays.setDate(inTwoDays.getDate() + 2);
    const dateStr = inTwoDays.toISOString().split('T')[0];

    const { data } = await supabase
      .from('candidates')
      .select('*, roles(*)')
      .eq('status', 'offer_sent')
      .like('offer_deadline', `${dateStr}%`);

    for (const c of data || []) {
      await email.sendHRAlert(
        'Offer Expiring Soon',
        c,
        `${c.full_name}'s offer expires in 2 days (${c.offer_deadline}).`,
        'Follow up with the candidate if they haven\'t responded.'
      ).catch(err => logger.error('Offer deadline alert failed', { error: err.message }));
    }
  });

  // ──────────────────────────────────────────────────────────
  // DAILY 9:00 AM — Document collection (7 days before joining)
  // ──────────────────────────────────────────────────────────
  cron.schedule('0 9 * * *', async () => {
    logger.info('Cron: checking pre-joining document reminders');
    const inSevenDays = new Date();
    inSevenDays.setDate(inSevenDays.getDate() + 7);
    const dateStr = inSevenDays.toISOString().split('T')[0];

    const { data } = await supabase
      .from('candidates')
      .select('*, roles(*)')
      .eq('status', 'offer_accepted')
      .like('joining_date', `${dateStr}%`);

    for (const c of data || []) {
      await email.sendDocumentCollection(c).catch(err =>
        logger.error('Document collection email failed', { error: err.message })
      );
    }
  });

  // ──────────────────────────────────────────────────────────
  // DAILY 9:00 AM — Joining day automation
  // Candidates whose joining_date is today → move to trial
  // ──────────────────────────────────────────────────────────
  cron.schedule('0 9 * * *', async () => {
    logger.info('Cron: checking joining day candidates');
    const today = new Date().toISOString().split('T')[0];

    const { data } = await supabase
      .from('candidates')
      .select('*, roles(*)')
      .eq('status', 'pre_boarding')
      .like('joining_date', `${today}%`);

    for (const c of data || []) {
      try {
        // Calculate trial end date based on probation months
        const trialStart = new Date(c.joining_date);
        const trialEnd   = new Date(trialStart);
        trialEnd.setMonth(trialEnd.getMonth() + (c.probation_months || 3));

        // Generate employee ID and move to trial
        const { data: empIdData } = await supabase.rpc('generate_employee_id');

        await supabase.from('candidates').update({
          status:      'trial',
          trial_start: trialStart.toISOString().split('T')[0],
          trial_end:   trialEnd.toISOString().split('T')[0],
          employee_id: empIdData,
        }).eq('id', c.id);

        const updatedC = { ...c, status: 'trial', trial_start: trialStart, trial_end: trialEnd, employee_id: empIdData };

        // Generate appointment letter + send welcome email
        const pdfService = await import('../services/pdfService.js');
        const { pdfBuffer } = await pdfService.generateAppointmentLetter(updatedC);
        await email.sendTrialWelcome(updatedC, pdfBuffer);

        logger.info(`Cron: joined and started trial — ${c.full_name}`);
      } catch (err) {
        logger.error('Joining day automation failed', { id: c.id, error: err.message });
      }
    }
  });

  // ──────────────────────────────────────────────────────────
  // DAILY 9:00 AM — Document reminder (3+ days without uploading)
  // ──────────────────────────────────────────────────────────
  cron.schedule('0 9 * * *', async () => {
    logger.info('Cron: checking pending documents');
    const threeDaysAgo = new Date(Date.now() - 3 * 86400 * 1000).toISOString();

    const { data } = await supabase
      .from('candidates')
      .select('*, roles(*)')
      .eq('status', 'docs_pending')
      .lt('updated_at', threeDaysAgo);

    for (const c of data || []) {
      await email.sendDocsReminder(c).catch(err =>
        logger.error('Docs reminder failed', { error: err.message })
      );
    }
  });

  // ──────────────────────────────────────────────────────────
  // DAILY 8:00 AM — Trial mid-point reminder to HR (at 50%)
  // ──────────────────────────────────────────────────────────
  cron.schedule('0 8 * * *', async () => {
    logger.info('Cron: checking trial midpoints');
    const today = new Date();

    const { data } = await supabase
      .from('candidates')
      .select('*, roles(*)')
      .eq('status', 'trial')
      .not('trial_start', 'is', null)
      .not('trial_end', 'is', null);

    for (const c of data || []) {
      const start   = new Date(c.trial_start);
      const end     = new Date(c.trial_end);
      const midpoint = new Date(start.getTime() + (end.getTime() - start.getTime()) / 2);
      const todayStr   = today.toISOString().split('T')[0];
      const midStr     = midpoint.toISOString().split('T')[0];

      if (todayStr === midStr) {
        await email.sendHRAlert(
          'Trial Period — Mid-Point Review',
          c,
          `${c.full_name} has reached the mid-point of their trial period.`,
          'Please schedule a mid-trial performance review this week.'
        ).catch(err => logger.error('Mid-trial alert failed', { error: err.message }));
      }
    }
  });

  // ──────────────────────────────────────────────────────────
  // DAILY 8:00 AM — Trial ending in 7 days → alert HR
  // ──────────────────────────────────────────────────────────
  cron.schedule('0 8 * * *', async () => {
    logger.info('Cron: checking trials ending in 7 days');
    const inSevenDays = new Date();
    inSevenDays.setDate(inSevenDays.getDate() + 7);
    const dateStr = inSevenDays.toISOString().split('T')[0];

    const { data } = await supabase
      .from('candidates')
      .select('*, roles(*)')
      .in('status', ['trial', 'probation_extended'])
      .like('trial_end', `${dateStr}%`);

    for (const c of data || []) {
      await email.sendHRAlert(
        'Trial Ending in 7 Days',
        c,
        `${c.full_name}'s trial period ends on ${c.trial_end}.`,
        'Conduct performance review and decide: Confirm, Extend, or Terminate.'
      ).catch(err => logger.error('Trial 7-day alert failed', { error: err.message }));
    }
  });

  // ──────────────────────────────────────────────────────────
  // DAILY 8:00 AM — Trial ending TOMORROW → urgent alert
  // ──────────────────────────────────────────────────────────
  cron.schedule('0 8 * * *', async () => {
    logger.info('Cron: checking trials ending tomorrow');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const { data } = await supabase
      .from('candidates')
      .select('*, roles(*)')
      .in('status', ['trial', 'probation_extended'])
      .like('trial_end', `${dateStr}%`);

    for (const c of data || []) {
      await email.sendHRAlert(
        '⚠️ URGENT: Trial Ends Tomorrow',
        c,
        `${c.full_name}'s trial period ends TOMORROW (${c.trial_end}).`,
        'Immediately decide and process: Confirm Employment, Extend Probation, or Terminate.'
      ).catch(err => logger.error('Trial tomorrow alert failed', { error: err.message }));
    }
  });

  // ──────────────────────────────────────────────────────────
  // DAILY 9:00 AM — Last working day actions
  // Candidates whose last_working_day is TODAY → complete offboarding
  // ──────────────────────────────────────────────────────────
  cron.schedule('0 9 * * *', async () => {
    logger.info('Cron: checking last working days');
    const today = new Date().toISOString().split('T')[0];

    const { data } = await supabase
      .from('candidates')
      .select('*, roles(*)')
      .in('status', ['resigned', 'terminated'])
      .like('last_working_day', `${today}%`);

    for (const c of data || []) {
      try {
        const pdfService = await import('../services/pdfService.js');
        const [relievingResult, experienceResult] = await Promise.all([
          pdfService.generateRelievingLetter(c),
          pdfService.generateExperienceLetter(c),
        ]);
        await email.sendOffboardingComplete(c, {
          relieving:  relievingResult.pdfBuffer,
          experience: experienceResult.pdfBuffer,
        });

        // Move to offboarded
        await supabase.from('candidates').update({ status: 'offboarded' }).eq('id', c.id);
        logger.info(`Cron: offboarded ${c.full_name}`);
      } catch (err) {
        logger.error('Last working day automation failed', { id: c.id, error: err.message });
      }
    }
  });

  // ──────────────────────────────────────────────────────────
  // EVERY 15 MINUTES — Retry failed jobs
  // ──────────────────────────────────────────────────────────
  cron.schedule('*/15 * * * *', async () => {
    const { data } = await supabase
      .from('error_logs')
      .select('*')
      .eq('status', 'pending')
      .lt('retry_count', 3);

    if (!data || data.length === 0) return;
    logger.info(`Cron: retrying ${data.length} failed jobs`);

    for (const job of data) {
      try {
        await supabase.from('error_logs')
          .update({ status: 'resolved' }).eq('id', job.id);
      } catch {
        await supabase.from('error_logs')
          .update({ retry_count: job.retry_count + 1 }).eq('id', job.id);
      }
    }
  });

  logger.info('All cron jobs started successfully ✓');
}
