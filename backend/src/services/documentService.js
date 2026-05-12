import { supabase } from '../config/supabase.js';
import { auditLog }  from './auditService.js';
import * as drive    from './driveService.js';
import { REQUIRED_DOCUMENTS } from '../utils/documentTypes.js';

// Get all documents for a candidate
export async function getDocuments(candidateId) {
  const { data, error } = await supabase
    .from('documents')
    .select('*, users(name)')
    .eq('candidate_id', candidateId)
    .order('uploaded_at', { ascending: false });
  if (error) throw error;
  return data;
}

// Get the structured checklist for a candidate
export async function getChecklist(candidateId) {
  const docs = await getDocuments(candidateId);
  
  return REQUIRED_DOCUMENTS.map(req => {
    // Find the latest document of this type
    const existing = docs.filter(d => d.type === req.type)[0]; // already ordered by date desc
    
    return {
      ...req,
      status: existing ? existing.verification_status : 'missing',
      document: existing || null,
      rejection_reason: existing?.rejection_reason || null
    };
  });
}

// Upload a document — receives base64 from frontend
export async function uploadDocument(candidateId, fileBase64, filename, fileType) {
  const buffer  = Buffer.from(fileBase64, 'base64');
  const fileUrl = await drive.uploadPdf(buffer, filename);

  const { data, error } = await supabase
    .from('documents')
    .insert({ 
      candidate_id: candidateId, 
      file_url: fileUrl, 
      type: fileType // now should be one of our standard types
    })
    .select()
    .single();

  if (error) throw error;

  // Also update candidate status to 'docs_submitted' if they were in 'pre_boarding'
  await supabase.from('candidates')
    .update({ status: 'docs_submitted' })
    .eq('id', candidateId)
    .eq('status', 'pre_boarding');

  return data;
}

// HR verifies or rejects a document
export async function verifyDocument(documentId, status, actorId, rejectionReason = null) {
  const { data, error } = await supabase
    .from('documents')
    .update({
      verification_status: status,
      rejection_reason:    rejectionReason,
      verified_by:         actorId,
      verified_at:         new Date().toISOString(),
    })
    .eq('id', documentId)
    .select()
    .single();

  if (error) throw error;
  await auditLog(actorId, `document.${status}`, 'documents', documentId);

  // If rejected, maybe move candidate back to a "Docs Needed" state?
  // For now, the portal will show the rejection.

  return data;
}

// Check if ALL documents for a candidate are verified
export async function allDocsVerified(candidateId) {
  const checklist = await getChecklist(candidateId);
  return checklist.every(item => item.status === 'verified');
}
