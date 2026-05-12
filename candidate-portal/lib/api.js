// Portal API — no JWT, candidates use their unique token
const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  candidates: {
    getByToken: (token)         => req(`/api/candidates/portal/${token}`),
    respond:    (token, action) => req(`/api/candidates/portal/${token}/respond`, {
      method: 'POST', body: JSON.stringify({ action }),
    }),
  },
  documents: {
    upload: (body) => req('/api/documents/upload', { method: 'POST', body: JSON.stringify(body) }),
  },
};
