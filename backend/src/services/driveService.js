// ============================================================
// NELU — File Storage Service
// Stores PDFs in Supabase instead of Google Drive.
// No Google Drive quota issues. Works everywhere.
// ============================================================
import { supabase } from '../config/supabase.js';

// Stores a PDF buffer in Supabase and returns a download URL
// The URL points to your backend download endpoint
export async function uploadPdf(buffer, filename) {
  // Convert buffer to base64 string for storage
  const base64 = Buffer.from(buffer).toString('base64');

  // Store in Supabase storage table
  const { data, error } = await supabase
    .from('pdf_storage')
    .insert({
      filename,
      pdf_data: base64,
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) throw new Error(`PDF storage failed: ${error.message}`);

  // Return a URL that points to your backend download endpoint
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  return `${backendUrl}/api/files/${data.id}`;
}