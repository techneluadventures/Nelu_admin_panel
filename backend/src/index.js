import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

import { authRouter } from './routes/auth.js';
import { candidatesRouter } from './routes/candidates.js';
import { documentsRouter } from './routes/documents.js';
import { rolesRouter } from './routes/roles.js';
import { auditRouter } from './routes/audit.js';
import { filesRouter } from './routes/files.js';
import { crmRouter } from './routes/crm.js';
import { startCrons } from './crons/index.js';

const app = express();

// Global request logger and JSON Enforcement
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.path !== '/api/health') {
    console.log(`[REQ] ${req.method} ${req.path} | Origin: ${req.headers.origin}`);
  }
  next();
});

// Security headers - Relaxed for local network development
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
}));
app.use(cookieParser());

// CORS configuration - Dynamic for WLAN/Mobile access
app.use(cors({
  origin: true, // Echo back the request origin - perfect for local dev across IPs
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000, // Increased for production
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use('/api', limiter);

// Global JSON payload limit
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  company: process.env.COMPANY_NAME,
  time: new Date().toISOString(),
}));

// ─── ROUTES ──────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/files', filesRouter);
app.use('/api/candidates', candidatesRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/audit', auditRouter);
app.use('/api/crm', crmRouter);

// ─── ERROR HANDLING (MUST BE LAST) ───────────────────────────

// 1. JSON 404 Handler for API
app.use('/api', (req, res) => {
  console.warn(`[404] ${req.method} ${req.path} — Not Found`);
  res.status(404).json({ 
    error: 'Endpoint not found', 
    path: req.originalUrl,
    code: 'NOT_FOUND' 
  });
});

// 2. Global JSON Error Handler
app.use((err, req, res, next) => {
  const status = err.statusCode || err.status || 500;
  console.error(`[FATAL ERROR] ${status} — ${err.message}`, {
    path: req.path,
    stack: err.stack
  });

  // Always return JSON, never HTML
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
});

// Start background jobs
startCrons();

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ NELU Hardened Production Engine running on port ${PORT}`);
});

export default app;
