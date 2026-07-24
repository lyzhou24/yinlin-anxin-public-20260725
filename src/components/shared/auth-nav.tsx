'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  AUTH_CHANGE_EVENT,
  getAuthSession,
  getAvatarInitial,
  type AuthSessionUser,
} from '@/lib/auth-session';

export function AuthNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthSessionUser | null>(null);

  useEffect(() => {
    const refreshUser = () => setUser(getAuthSession());
    refreshUser();
    window.addEventListener(AUTH_CHANGE_EVENT, refreshUser);
    window.addEventListener('storage', refreshUser);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, refreshUser);
      window.removeEventListener('storage', refreshUser);
    };
  }, [pathname]);

  if (pathname === '/login') {
    return null;
  }

  if (!user) {
    return (
      <Link href="/login" className="text-foreground/70 hover:text-primary transition-colors text-base">
        登录
      </Link>
    );
  }

  return (
    <>
      <Link href="/history" className="text-foreground/70 hover:text-primary transition-colors text-base">
        历史记录
      </Link>
      <Link
        href="/account"
        aria-label={`账户：${user.username}`}
        title={user.username}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground hover:opacity-90 transition-opacity"
      >
        {getAvatarInitial(user.username)}
      </Link>
    </>
  );
}
