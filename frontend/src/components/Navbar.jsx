'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { api, getUser } from '../lib/api';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = getUser();
    if (u) setUser(u);
  }, []);

  async function logout() {
    try {
      await api.auth.logout();
      router.push('/login');
    } catch (err) {
      console.error('Logout failed', err);
      localStorage.removeItem('nelu_user');
      router.push('/login');
    }
  }

  // Determine current active module based on pathname
  let activeModule = 'hr';
  if (pathname.startsWith('/crm') || pathname.startsWith('/leads')) activeModule = 'crm';
  if (pathname.startsWith('/projects')) activeModule = 'projects';

  const modules = [];
  modules.push({ id: 'crm', label: 'Admin CRM', href: '/crm', activePath: '/crm' });
  modules.push({ id: 'hr', label: 'HR System', href: '/dashboard', activePath: '/dashboard' });
  modules.push({ id: 'projects', label: 'Installations', href: '/projects', activePath: '/projects' });

  const secondaryNav = {
    hr: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/candidates', label: 'Candidates' },
      { href: '/roles', label: 'Roles' },
      ...(user?.role === 'admin' ? [{ href: '/audit', label: 'Audit' }] : []),
    ],
    crm: [
      { href: '/crm', label: 'Master Pipeline' },
      { href: '/crm/leads/new', label: '+ Add Lead' },
      { href: '/crm/import', label: 'Bulk Import (CSV)' },
    ],
    projects: [
      { href: '/projects', label: 'Active Projects' },
    ],
  };

  const currentLinks = secondaryNav[activeModule] || [];

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      {/* Primary Top Bar (Modules) */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-gray-100">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="https://res.cloudinary.com/dxkep3bnj/image/upload/v1777731308/Nelu_logo_uu6nni.png" alt="Nelu" className="h-8 w-auto" />
            <span className="font-bold text-lg tracking-tight text-[#FC922E]" style={{ fontFamily: "var(--font-logo)" }}>
              NELU ADVENTURES
            </span>
          </Link>
          <div className="flex gap-2 ml-4 border-l border-gray-200 pl-4">
            {modules.map(m => (
              <Link key={m.id} href={m.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeModule === m.id
                    ? 'bg-[#FC922E] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                {m.label}
              </Link>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
              <span className="w-6 h-6 rounded-full bg-[#014905] text-white flex items-center justify-center font-bold text-xs">
                {user.name?.charAt(0)}
              </span>
              <span>{user.name}</span>
              <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded text-xs capitalize ml-1">{user.role}</span>
            </div>
          )}
          <button onClick={logout}
            className="text-xs text-red-600 font-medium hover:text-white px-3 py-1.5 rounded border border-red-200 hover:bg-red-600 hover:border-red-600 transition-colors">
            Sign out
          </button>
        </div>
      </div>

      {/* Secondary Navigation (Sub-pages for active module) */}
      <div className="px-6 py-2 flex items-center gap-1 bg-[#f8f9fa]">
        {currentLinks.map(l => {
          const isActive = pathname === l.href || (pathname.startsWith(l.href) && l.href !== '/dashboard' && l.href !== '/crm');
          return (
            <Link key={l.href} href={l.href}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                isActive
                  ? 'text-[#014905] font-bold bg-[#e6f3e6]'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}>
              {l.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}