'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';


export default function AccountStatus() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/check');
      const data = await response.json();
      setSession(data.authenticated ? data : null);
    } catch (error) {
      console.error('Failed to check session:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setSession(null);
      router.push('/');
      router.refresh();
    }
  };

  if (loading || !session) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-white/90">
      <span>
        {session.user?.email} <span className="opacity-70">({session.role})</span>
      </span>
      <button
        onClick={handleLogout}
        className="rounded border border-white/40 px-2 py-0.5 hover:bg-white/10 transition-colors"
      >
        Logout
      </button>
    </div>
  );
}
