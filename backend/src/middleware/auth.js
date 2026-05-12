import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';

// This middleware runs before every protected route.
// It checks the Authorization header for a valid JWT token.
// If valid, it attaches the user info to req.user so routes can use it.

export async function verifyJWT(req, res, next) {
  let token = req.cookies.nelu_token;

  // Log for debugging WLAN/Mobile access
  console.log(`[AUTH] ${req.method} ${req.path} | Cookie: ${!!token} | AuthHeader: ${!!req.headers.authorization}`);

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts[0] === 'Bearer') token = parts[1];
    if (token) console.log(`[AUTH] Using Bearer token fallback`);
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  try {
    // Verify the token using our secret key from .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // FORENSIC AUDIT FIX: Check if user still exists and is active
    const { data: user, error } = await supabase
      .from('users')
      .select('role, email')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'User account not found or deactivated.' });
    }

    // Attach the decoded user info + fresh role to the request object
    req.user = { ...decoded, role: user.role };
    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Session expired. Please log in again.' : 'Invalid session.';
    return res.status(401).json({ error: message });
  }
}
