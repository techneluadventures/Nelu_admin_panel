'use client';

// This is the single place that talks to the backend.
// Every frontend page imports functions from here — never calls fetch directly.
// It reads the backend URL from the environment variable.

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Helper: get the saved JWT token from localStorage
function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('nelu_token') : null;
}

// Helper: make an authenticated API request
async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export const api = {
  auth: {
    login: (email, password) =>
      request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    logout: () => request('/api/auth/logout', { method: 'POST' }),
  },

  // ── Candidates ─────────────────────────────────────────────────────────────
  candidates: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/api/candidates${qs ? '?' + qs : ''}`);
    },
    get: (id) => request(`/api/candidates/${id}`),
    invite: (body) => request('/api/candidates', { method: 'POST', body: JSON.stringify(body) }),
    advanceStatus: (id, status) =>
      request(`/api/candidates/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    setTrial: (id, trial_start, trial_end) =>
      request(`/api/candidates/${id}/trial`, { method: 'PATCH', body: JSON.stringify({ trial_start, trial_end }) }),
    getByToken: (token) => request(`/api/candidates/portal/${token}`),
  },

  // ── Documents ──────────────────────────────────────────────────────────────
  documents: {
    list: (candidateId) => request(`/api/documents?candidate_id=${candidateId}`),
    verify: (id, status) =>
      request(`/api/documents/${id}/verify`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    upload: (body) => request('/api/documents/upload', { method: 'POST', body: JSON.stringify(body) }),
  },

  // ── Roles ──────────────────────────────────────────────────────────────────
  roles: {
    list: () => request('/api/roles'),
    create: (body) => request('/api/roles', { method: 'POST', body: JSON.stringify(body) }),
    addTemplate: (id, body) =>
      request(`/api/roles/${id}/templates`, { method: 'POST', body: JSON.stringify(body) }),
  },

  // ── Agreements ─────────────────────────────────────────────────────────────
  agreements: {
    list: (candidateId) => request(`/api/agreements?candidate_id=${candidateId}`),
    generate: (candidateId) =>
      request('/api/agreements/generate', { method: 'POST', body: JSON.stringify({ candidate_id: candidateId }) }),
  },

  // ── Audit ──────────────────────────────────────────────────────────────────
  audit: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/api/audit${qs ? '?' + qs : ''}`);
    },
    errors: () => request('/api/audit/errors'),
  },

  // ── Workflow ───────────────────────────────────────────────────────────────
  workflow: {
    timeline: (candidateId) => request(`/api/workflow/${candidateId}`),
  },
};
