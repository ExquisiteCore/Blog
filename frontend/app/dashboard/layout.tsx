'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import type { User } from '@/types/api';

function getAuthSnapshot(): { user: User | null; isValid: boolean } {
  if (typeof window === 'undefined') {
    return { user: null, isValid: false };
  }
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  if (!token || !userStr) {
    return { user: null, isValid: false };
  }
  try {
    const userData = JSON.parse(userStr) as User;
    if (userData.role !== 'admin') {
      return { user: null, isValid: false };
    }
    return { user: userData, isValid: true };
  } catch {
    return { user: null, isValid: false };
  }
}

const serverSnapshot = { user: null, isValid: false };
function getServerSnapshot() { return serverSnapshot; }
function subscribe(cb: () => void) {
  window.addEventListener('storage', cb);
  return () => window.removeEventListener('storage', cb);
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const auth = useSyncExternalStore(subscribe, getAuthSnapshot, getServerSnapshot);
  const redirected = useRef(false);

  useEffect(() => {
    if (!auth.isValid && !redirected.current) {
      redirected.current = true;
      router.replace('/auth?redirect=/dashboard');
    }
  }, [auth.isValid, router]);

  // SSR 或未认证时显示加载中
  if (!auth.isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  const user = auth.user;

  return (
    <div className="flex min-h-screen bg-base-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 bg-base-100 border-b border-base-300 flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold">控制面板</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-base-content/70">
              欢迎，{user?.display_name || user?.username}
            </span>
            <div className="avatar placeholder">
              <div className="bg-primary text-primary-content rounded-full w-8">
                <span className="text-sm">
                  {(user?.username || 'U')[0].toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
