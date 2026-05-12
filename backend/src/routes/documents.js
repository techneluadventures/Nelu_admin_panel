import { Router }     from 'express';
import { verifyJWT }  from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import * as svc       from '../services/documentService.js';
import * as candSvc   from '../services/candidateService.js';
import express from 'express';

export const documentsRouter = Router();

// Apply larger limit specifically to the documents router
documentsRouter.use(express.json({ limit: '10mb' }));

// GET /api/documents?candidate_id=uuid
documentsRouter.get('/', verifyJWT, async (req, res, next) => {
  try {
    const data = await svc.getDocuments(req.query.candidate_id);
    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/documents/checklist?candidate_id=uuid
documentsRouter.get('/checklist', async (req, res, next) => {
  try {
    const data = await svc.getChecklist(req.query.candidate_id);
    res.json(data);
  } catch (err) { next(err); }
});

// POST /api/documents/upload
// Body: { candidate_id, file_type, filename, fileBase64 }
documentsRouter.post('/upload', async (req, res, next) => {
  try {
    const { candidate_id, file_type, filename, fileBase64 } = req.body;
    const data = await svc.uploadDocument(candidate_id, fileBase64, filename, file_type);

    // Auto-advance to docs_submitted if candidate is in docs_pending
    const candidate = await candSvc.getCandidate(candidate_id);
    if (candidate.status === 'docs_pending') {
      await candSvc.advanceStatus(candidate_id, 'docs_submitted', null);
    }

    res.status(201).json(data);
  } catch (err) { next(err); }
});

// PATCH /api/documents/:id/verify
// Body: { status: 'verified' | 'rejected', rejection_reason?: string }
documentsRouter.patch('/:id/verify', verifyJWT, requireRole('hr', 'admin'), async (req, res, next) => {
  try {
    const data = await svc.verifyDocument(
      req.params.id,
      req.body.status,
      req.user.id,
      req.body.rejection_reason
    );

    // If rejected — move candidate back to docs_pending for re-upload
    if (req.body.status === 'rejected') {
      await candSvc.advanceStatus(data.candidate_id, 'docs_pending', req.user.id).catch(() => {});
    }

    // Check if ALL docs verified → advance to docs_verified
    if (req.body.status === 'verified') {
      const allVerified = await svc.allDocsVerified(data.candidate_id);
      if (allVerified) {
        await candSvc.advanceStatus(data.candidate_id, 'docs_verified', req.user.id);
      }
    }

    res.json(data);
  } catch (err) { next(err); }
});
