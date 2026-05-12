'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '../lib/api';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('nelu_user');
      if (stored) setUser(JSON.parse(stored));
    } catch { }
  }, []);

  async function logout() {
    try {
      await api.auth.logout();
      router.push('/login');
    } catch (err) {
      console.error('Logout failed', err);
      // Force clear if API fails
      localStorage.removeItem('nelu_user');
      router.push('/login');
    }
  }

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-[#FC922E] tracking-tight text-xl flex items-center gap-2">
            <span className="bg-[#014905] text-white w-8 h-8 flex items-center justify-center rounded-lg text-lg">N</span>
            Nelu <span className="text-gray-400 font-medium">Field App</span>
          </Link>
          <div className="flex gap-4">
            <Link href="/" className="text-sm font-medium text-gray-800 border-b-2 border-[#FC922E] pb-1">
              My Dashboard
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-gray-500">Agent: </span>
            <span className="font-semibold text-gray-900">{user?.name || 'Loading...'}</span>
          </div>
          <button onClick={logout} className="text-sm text-red-500 hover:text-red-700 font-medium bg-red-50 px-3 py-1.5 rounded-md">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
