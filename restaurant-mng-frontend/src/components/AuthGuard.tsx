'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

const publicRoutes = ['/login', '/register', '/forgot-password', '/unauthorized'];
const authOnlyRoutes = ['/login', '/register', '/forgot-password'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state: any) => state.isAuthenticated);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;

    if (pathname === '/unauthorized') {
      if (isAuthenticated) {
        router.replace('/');
      }
      return;
    }

    if (authOnlyRoutes.includes(pathname)) {
      if (isAuthenticated) {
        router.replace('/');
      }
      return;
    }

    if (pathname === '/') {
      if (!isAuthenticated) {
        router.replace('/login');
      }
      return;
    }

    if (!publicRoutes.includes(pathname) && !isAuthenticated) {
      router.replace('/unauthorized');
    }
  }, [ready, isAuthenticated, pathname, router]);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}
