import { google } from 'googleapis';

// Parse the service account JSON from the environment variable
const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

// Create a Google Auth client using the service account
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

// Create and export the Drive client
export const drive = google.drive({ version: 'v3', auth });
