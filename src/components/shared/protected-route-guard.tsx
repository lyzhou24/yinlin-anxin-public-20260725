'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AUTH_CHANGE_EVENT, getAuthSession } from '@/lib/auth-session';
import type { UserRole } from '@/lib/types';

const PUBLIC_PATHS = new Set(['/', '/login', '/role-select', '/privacy', '/feedback', '/error', '/forbidden', '/robots.txt']);
const PATH_ROLE_REQUIREMENTS: Partial<Record<string, UserRole[]>> = {
  '/family': ['elder', 'family'],
  '/profile-setup': ['elder'],
};

export function ProtectedRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorizedPath, setAuthorizedPath] = useState('');
  const isPublicPath = PUBLIC_PATHS.has(pathname) || pathname.startsWith('/share/family/');

  useEffect(() => {
    const checkAuth = () => {
      if (PUBLIC_PATHS.has(pathname) || pathname.startsWith('/share/family/')) {
        setAuthorizedPath(pathname);
        return;
      }
      const session = getAuthSession();
      if (session?.user_role) {
        const allowedRoles = PATH_ROLE_REQUIREMENTS[pathname];
        if (!allowedRoles || allowedRoles.includes(session.user_role)) {
          setAuthorizedPath(pathname);
          return;
        }
        setAuthorizedPath('');
        router.replace('/forbidden');
        return;
      }
      setAuthorizedPath('');
      router.replace('/login');
    };
    checkAuth();
    window.addEventListener(AUTH_CHANGE_EVENT, checkAuth);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, checkAuth);
  }, [pathname, router]);

  if (!isPublicPath && authorizedPath !== pathname) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-lg text-muted-foreground">正在检查登录状态……</p>
      </div>
    );
  }

  return children;
}
