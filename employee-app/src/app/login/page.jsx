// frontend/app/login/page.jsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getUser } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const user = getUser();
    if (user) router.push('/');
  }, [router]);

  if (!mounted) return null; // Prevent hydration mismatch

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      console.log('Attempting login for:', email);
      await api.auth.login(email, password);
      router.push('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
      alert('Login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 w-full max-w-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">NELU</h1>
          <p className="text-sm text-gray-500 mt-1">HR Management System</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input type="email" value={email} required
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-gray-400"
              placeholder="you@company.com" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm text-gray-600">Password</label>
              <Link href="/forgot-password" size="sm" className="text-xs text-blue-600 hover:underline">Forgot password?</Link>
            </div>
            <input type="password" value={password} required
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-gray-400"
              placeholder="••••••••" />
          </div>
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <div className="mt-8 text-[10px] text-gray-400 font-mono text-center">
        Host: {typeof window !== 'undefined' ? window.location.hostname : 'N/A'} <br/>
        Auth: {getUser() ? 'YES' : 'NO'}
      </div>
    </div>
  </div>
);
}
