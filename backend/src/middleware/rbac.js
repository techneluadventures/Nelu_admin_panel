// RBAC = Role Based Access Control
// This middleware checks if the logged-in user has the right role.
// Usage in routes: requireRole('admin') or requireRole('hr', 'admin')

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // req.user is set by verifyJWT middleware which runs before this
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
      });
    }

    next(); // User has the right role, continue
  };
}
