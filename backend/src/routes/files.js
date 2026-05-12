import { Router } from 'express';
import { supabase } from '../config/supabase.js';

export const filesRouter = Router();

// GET /api/files/:id — anyone can download a PDF by its ID
// No auth needed — the ID itself is the access key (unguessable UUID)
filesRouter.get('/:id', async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('pdf_storage')
            .select('filename, pdf_data')
            .eq('id', req.params.id)
            .single();

        if (error || !data) return res.status(404).json({ error: 'File not found' });

        const buffer = Buffer.from(data.pdf_data, 'base64');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${data.filename}"`);
        res.send(buffer);
    } catch (err) { next(err); }
});