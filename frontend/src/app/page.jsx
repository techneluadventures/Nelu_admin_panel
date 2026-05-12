'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../lib/api';

export default function HomePage() {
  const router = useRouter();
  
  useEffect(() => {
    const user = getUser();
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return <div className="p-8 text-gray-400">Loading...</div>;
}