import { z } from 'zod';

export const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      const issues = err.errors || err.issues || [];
      const firstError = issues[0]?.message || 'Validation failed';
      return res.status(400).json({ 
        error: firstError, 
        details: issues.map(e => ({ path: e.path, message: e.message })) 
      });
    }
    return res.status(400).json({ error: 'Invalid request data' });
  }
};

// --- Auth Schemas ---
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// --- CRM Schemas ---
export const leadSchema = z.object({
  resort_name: z.string().trim().optional().nullable(),
  client_name: z.string().trim().min(1, 'Client name is required'),
  contact_person: z.string().trim().optional().nullable(),
  phone: z.string().trim().min(10, 'Valid phone number is required'),
  email: z.string().trim().email().optional().nullable().or(z.literal('')),
  location: z.string().trim().optional().nullable(),
  source: z.string().trim().optional().nullable(),
  category: z.string().trim().optional().nullable(),
  interest_level: z.string().optional().nullable(),
  budget_range: z.string().optional().nullable(),
  timeline: z.string().optional().nullable(),
  decision_maker: z.boolean().optional().default(false),
  notes: z.string().trim().optional().nullable(),
});

export const bulkLeadSchema = z.object({
  leads: z.array(z.object({
    resort_name: z.string().trim().optional().nullable(),
    client_name: z.string().trim().optional().nullable(),
    contact_person: z.string().trim().optional().nullable(),
    phone: z.string().trim().min(1, 'Phone is required for import'),
    email: z.string().trim().optional().nullable(),
    location: z.string().trim().optional().nullable(),
    source: z.string().trim().optional().nullable(),
    category: z.string().trim().optional().nullable(),
  })).min(1, 'At least one lead is required'),
});
