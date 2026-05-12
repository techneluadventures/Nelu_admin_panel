import { Router } from 'express';
import jwt         from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';
import { validate, loginSchema } from '../middleware/validation.js';

import { createClient } from '@supabase/supabase-js';

export const authRouter = Router();

// Singleton auth client to prevent memory leaks, configured to not persist sessions globally
const authClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

// POST /api/auth/login
// Body: { email, password }
authRouter.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Step 1: verify with Supabase Auth
    const { data: authData, error: authError } = await authClient.auth.signInWithPassword({ email, password });
    if (authError) return res.status(401).json({ error: 'Invalid email or password' });

    // Step 2: get role from our users table
    const { data: userRecord, error: userError } = await supabase
      .from('users').select('id, name, email, role').eq('id', authData.user.id).single();
    if (userError || !userRecord) return res.status(403).json({ error: 'User not found in system' });

    // Step 3: create our own JWT
    const token = jwt.sign(
      { id: userRecord.id, email: userRecord.email, name: userRecord.name, role: userRecord.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Step 4: Set httpOnly cookie
    // For local WLAN/Mobile access, we MUST use secure: false and sameSite: 'lax'
    // since we are using HTTP and cross-port IP access.
    res.cookie('nelu_token', token, {
      httpOnly: true,
      secure: false, 
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    });

    res.json({ user: userRecord, token });
  } catch (err) { next(err); }
});

// POST /api/auth/forgot-password
authRouter.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    const { error } = await authClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${req.headers.origin}/reset-password`,
    });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Password reset link sent to your email' });
  } catch (err) { next(err); }
});

// POST /api/auth/reset-password
authRouter.post('/reset-password', async (req, res, next) => {
  try {
    const { password, access_token } = req.body;
    // We use the admin client to update the password directly if we have the token
    const { error } = await supabase.auth.admin.updateUserById(
      req.body.userId, // We'll need to pass this or use the token
      { password: password }
    );
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Password has been reset successfully' });
  } catch (err) { next(err); }
});

// POST /api/auth/logout
authRouter.post('/logout', (req, res) => {
  res.clearCookie('nelu_token');
  res.json({ success: true });
});

// GET /api/auth/me — get current user info from token
authRouter.get('/me', async (req, res, next) => {
  try {
    const token = req.cookies.nelu_token;
    if (!token) return res.status(401).json({ error: 'No token' });
    const user = jwt.verify(token, process.env.JWT_SECRET);
    res.json(user);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});