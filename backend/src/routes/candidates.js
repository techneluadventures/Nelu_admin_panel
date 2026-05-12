// ============================================================
// NELU — Candidates Routes
// Every HTTP endpoint for the candidate lifecycle.
// ============================================================
import { Router }      from 'express';
import { verifyJWT }   from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import * as svc        from '../services/candidateService.js';
import * as userSvc   from '../services/userService.js';

export const candidatesRouter = Router();

// ─── Public route for Google Form (no JWT, uses secret key) ─
candidatesRouter.post('/public', async (req, res, next) => {
  try {
    const secret = req.headers['x-form-secret'];
    if (secret !== process.env.FORM_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const data = await svc.createCandidate(req.body, null);
    res.status(201).json(data);
  } catch (err) { next(err); }
});

// ─── Portal route — candidate views their own data ──────────
candidatesRouter.get('/portal/:token', async (req, res, next) => {
  try {
    const data = await svc.getCandidateByToken(req.params.token);
    res.json(data);
  } catch (err) { next(err); }
});

// ─── Candidate accepts or declines offer via portal ─────────
candidatesRouter.post('/portal/:token/respond', async (req, res, next) => {
  try {
    const candidate = await svc.getCandidateByToken(req.params.token);
    const { action } = req.body; // 'accept' or 'decline'
    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ error: 'action must be accept or decline' });
    }
    const toStatus = action === 'accept' ? 'offer_accepted' : 'offer_declined';
    const data = await svc.advanceStatus(candidate.id, toStatus, null);
    res.json(data);
  } catch (err) { next(err); }
});

// ─── GET all candidates ──────────────────────────────────────
candidatesRouter.get('/', verifyJWT, async (req, res, next) => {
  try {
    const data = await svc.listCandidates(req.query);
    res.json(data);
  } catch (err) { next(err); }
});

// ─── GET dashboard stats ─────────────────────────────────────
candidatesRouter.get('/stats', verifyJWT, async (req, res, next) => {
  try {
    const data = await svc.getDashboardStats();
    res.json(data);
  } catch (err) { next(err); }
});

// ─── GET one candidate ───────────────────────────────────────
candidatesRouter.get('/:id', verifyJWT, async (req, res, next) => {
  try {
    const data = await svc.getCandidate(req.params.id);
    res.json(data);
  } catch (err) { next(err); }
});

// ─── POST create candidate (manual from dashboard) ──────────
candidatesRouter.post('/', verifyJWT, requireRole('hr', 'admin'), async (req, res, next) => {
  try {
    const data = await svc.createCandidate(req.body, req.user.id);
    res.status(201).json(data);
  } catch (err) { next(err); }
});

// ─── PATCH advance status (generic) ─────────────────────────
candidatesRouter.patch('/:id/status', verifyJWT, requireRole('hr', 'admin'), async (req, res, next) => {
  try {
    const data = await svc.advanceStatus(req.params.id, req.body.status, req.user.id, req.body.extra || {});
    res.json(data);
  } catch (err) { next(err); }
});

// ─── PATCH shortlist + schedule interview ───────────────────
candidatesRouter.patch('/:id/shortlist', verifyJWT, requireRole('hr', 'admin'), async (req, res, next) => {
  try {
    const data = await svc.shortlistCandidate(req.params.id, req.body, req.user.id);
    res.json(data);
  } catch (err) { next(err); }
});

// ─── PATCH send offer ────────────────────────────────────────
candidatesRouter.patch('/:id/offer', verifyJWT, requireRole('hr', 'admin'), async (req, res, next) => {
  try {
    const data = await svc.sendOffer(req.params.id, req.body, req.user.id);
    res.json(data);
  } catch (err) { next(err); }
});

// ─── PATCH start trial ───────────────────────────────────────
candidatesRouter.patch('/:id/trial', verifyJWT, requireRole('hr', 'admin'), async (req, res, next) => {
  try {
    const data = await svc.startTrial(req.params.id, req.body, req.user.id);
    res.json(data);
  } catch (err) { next(err); }
});

// ─── POST provision account (manual trigger) ─────────────────
candidatesRouter.post('/:id/provision', verifyJWT, requireRole('hr', 'admin'), async (req, res, next) => {
  try {
    const candidate = await svc.getCandidate(req.params.id);
    const result = await userSvc.provisionEmployeeAccount(candidate);
    res.json(result);
  } catch (err) { next(err); }
});


// ─── PATCH extend probation ──────────────────────────────────
candidatesRouter.patch('/:id/extend', verifyJWT, requireRole('hr', 'admin'), async (req, res, next) => {
  try {
    const data = await svc.extendProbation(req.params.id, req.body, req.user.id);
    res.json(data);
  } catch (err) { next(err); }
});

// ─── PATCH confirm employment ────────────────────────────────
candidatesRouter.patch('/:id/confirm', verifyJWT, requireRole('hr', 'admin'), async (req, res, next) => {
  try {
    // docs_verified → confirmed → active
    await svc.advanceStatus(req.params.id, 'confirmed', req.user.id);
    const data = await svc.advanceStatus(req.params.id, 'active', req.user.id);
    res.json(data);
  } catch (err) { next(err); }
});

// ─── PATCH resign ────────────────────────────────────────────
candidatesRouter.patch('/:id/resign', verifyJWT, requireRole('hr', 'admin'), async (req, res, next) => {
  try {
    const data = await svc.initiateResignation(req.params.id, req.body, req.user.id);
    res.json(data);
  } catch (err) { next(err); }
});

// ─── PATCH terminate ─────────────────────────────────────────
candidatesRouter.patch('/:id/terminate', verifyJWT, requireRole('hr', 'admin'), async (req, res, next) => {
  try {
    const data = await svc.initiateTermination(req.params.id, req.body, req.user.id);
    res.json(data);
  } catch (err) { next(err); }
});

// ─── PATCH complete offboarding ──────────────────────────────
candidatesRouter.patch('/:id/offboard', verifyJWT, requireRole('hr', 'admin'), async (req, res, next) => {
  try {
    const data = await svc.completeOffboarding(req.params.id, req.user.id);
    res.json(data);
  } catch (err) { next(err); }
});
