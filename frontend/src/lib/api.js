'use client';
// ============================================================
// NELU — Frontend API Client
// Single place that talks to the backend.
// Every page imports from here — never calls fetch directly.
// ============================================================

let BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Dynamic detection for WLAN/Mobile access
if (typeof window !== 'undefined') {
  const { hostname, protocol } = window.location;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    BASE = `${protocol}//${hostname}:3001`;
    console.log('[API] Detected WLAN access, using BASE:', BASE);
  }
}


export function getUser() {
  try {
    const u = typeof window !== 'undefined' ? localStorage.getItem('nelu_user') : null;
    return u ? JSON.parse(u) : null;
  } catch { return null; }
}

async function req(path, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('nelu_token') : null;
  const url = `${BASE}${path}`;
  
  try {
    const res = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    
    const contentType = res.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  } else {
    const text = await res.text();
    console.error('[API] Non-JSON response received:', text.substring(0, 100));
    throw new Error(`Server returned non-JSON response (HTML). Check if backend is running on ${BASE}`);
  }
    
    if (!res.ok) {
      console.error(`[API] Error ${res.status} on ${url}:`, data);
      if (res.status === 401 && typeof window !== 'undefined') {
        if (!window.location.pathname.includes('/login')) {
          localStorage.removeItem('nelu_user');
          localStorage.removeItem('nelu_token');
          window.location.href = '/login?reason=unauthorized';
        }
      }
      throw new Error(data.error || `Error ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error(`[API] Fetch failed for ${url}:`, err);
    // If it's a network error, tell the user exactly which URL failed
    if (err.message === 'Failed to fetch') {
      throw new Error(`Connection failed to ${BASE}. Check if backend is running.`);
    }
    throw err;
  }
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────
  auth: {
    login: async (email, password) => {
      const data = await req('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      if (data.user) {
        localStorage.setItem('nelu_user', JSON.stringify(data.user));
        if (data.token) localStorage.setItem('nelu_token', data.token);
      }
      return data;
    },
    logout: async () => {
      await req('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('nelu_user');
      localStorage.removeItem('nelu_token');
    },
    me: () => req('/api/auth/me'),
    forgotPassword: (email) => req('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (body) => req('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),
  },

  // ── Candidates ────────────────────────────────────────────
  candidates: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return req(`/api/candidates${qs ? '?' + qs : ''}`);
    },
    stats: () => req('/api/candidates/stats'),
    get: (id) => req(`/api/candidates/${id}`),
    create: (body) => req('/api/candidates', { method: 'POST', body: JSON.stringify(body) }),
    // status transitions
    status: (id, status, extra = {}) =>
      req(`/api/candidates/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, extra }) }),
    shortlist: (id, body) =>
      req(`/api/candidates/${id}/shortlist`, { method: 'PATCH', body: JSON.stringify(body) }),
    sendOffer: (id, body) =>
      req(`/api/candidates/${id}/offer`, { method: 'PATCH', body: JSON.stringify(body) }),
    startTrial: (id, body) =>
      req(`/api/candidates/${id}/trial`, { method: 'PATCH', body: JSON.stringify(body) }),
    extend: (id, body) =>
      req(`/api/candidates/${id}/extend`, { method: 'PATCH', body: JSON.stringify(body) }),
    confirm: (id) => req(`/api/candidates/${id}/confirm`, { method: 'PATCH' }),
    resign: (id, body) =>
      req(`/api/candidates/${id}/resign`, { method: 'PATCH', body: JSON.stringify(body) }),
    terminate: (id, body) =>
      req(`/api/candidates/${id}/terminate`, { method: 'PATCH', body: JSON.stringify(body) }),
    offboard: (id) => req(`/api/candidates/${id}/offboard`, { method: 'PATCH' }),
    provision: (id) => req(`/api/candidates/${id}/provision`, { method: 'POST' }),
    // portal (no auth)
    getByToken: (token) => req(`/api/candidates/portal/${token}`),
    respond: (token, action) =>
      req(`/api/candidates/portal/${token}/respond`, { method: 'POST', body: JSON.stringify({ action }) }),
  },

  // ── Documents ─────────────────────────────────────────────
  documents: {
    list: (candidateId) => req(`/api/documents?candidate_id=${candidateId}`),
    checklist: (candidateId) => req(`/api/documents/checklist?candidate_id=${candidateId}`),
    upload: (body) => req('/api/documents/upload', { method: 'POST', body: JSON.stringify(body) }),
    verify: (id, status, rejection_reason = null) =>
      req(`/api/documents/${id}/verify`, { method: 'PATCH', body: JSON.stringify({ status, rejection_reason }) }),
  },

  // ── Roles ─────────────────────────────────────────────────
  roles: {
    list: () => req('/api/roles'),
    create: (body) => req('/api/roles', { method: 'POST', body: JSON.stringify(body) }),
    delete: (id) => req(`/api/roles/${id}`, { method: 'DELETE' }),
  },

  // ── Audit ─────────────────────────────────────────────────
  audit: {
    logs: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return req(`/api/audit${qs ? '?' + qs : ''}`);
    },
    errors: () => req('/api/audit/errors'),
    retry: (id) => req(`/api/audit/retry/${id}`, { method: 'POST' }),
    emails: (candidateId) => req(`/api/audit/emails?candidate_id=${candidateId}`),
  },

  // ── CRM ───────────────────────────────────────────────────
  crm: {
    leads: {
      list: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return req(`/api/crm/leads${qs ? '?' + qs : ''}`);
      },
      get: (id) => req(`/api/crm/leads/${id}`),
      create: (body) => req('/api/crm/leads', { method: 'POST', body: JSON.stringify(body) }),
      importBulk: (body) => req('/api/crm/leads/bulk', { method: 'POST', body: JSON.stringify(body) }),
      update: (id, body) => req(`/api/crm/leads/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
      claim: (id) => req(`/api/crm/leads/${id}/claim`, { method: 'PATCH' }),
      logVisit: (id, body) => req(`/api/crm/leads/${id}/visits`, { method: 'POST', body: JSON.stringify(body) }),
      generateQuote: (body) => req('/api/crm/quotations/generate', { method: 'POST', body: JSON.stringify(body) }),
    },
    quotations: {
      generate: (body) => req('/api/crm/quotations/generate', { method: 'POST', body: JSON.stringify(body) }),
    }
  },
};
