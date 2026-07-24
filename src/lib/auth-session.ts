import type { UserRole } from '@/lib/types';

export const AUTH_CHANGE_EVENT = 'yinling-auth-change';

export interface AuthSessionUser {
  user_id: string;
  username: string;
  phone: string;
  phone_full?: string;
  user_role: UserRole | null;
  last_login_at: string;
}

interface StoredAccount extends AuthSessionUser {
  created_at: string;
}

const AUTH_SESSION_KEY = 'yinling_auth_session';
const AUTH_ACCOUNTS_KEY = 'yinling_auth_accounts';

function readAccounts(): StoredAccount[] {
  if (typeof window === 'undefined') return [];

  try {
    return JSON.parse(localStorage.getItem(AUTH_ACCOUNTS_KEY) || '[]') as StoredAccount[];
  } catch {
    return [];
  }
}

function notifyAuthChange() {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function getAuthSession(): AuthSessionUser | null {
  if (typeof window === 'undefined') return null;

  try {
    const session = JSON.parse(localStorage.getItem(AUTH_SESSION_KEY) || 'null') as AuthSessionUser | null;
    const localPhoneSuffix = session?.user_id.match(/^usr_(\d{8})$/)?.[1];
    const maskedPhonePrefix = session?.phone.match(/^(\d{3})\*{4}\d{4}$/)?.[1];
    return session && !session.phone_full && localPhoneSuffix && maskedPhonePrefix
      ? { ...session, phone_full: `${maskedPhonePrefix}${localPhoneSuffix}` }
      : session;
  } catch {
    return null;
  }
}

export function completeLocalLogin(user: Omit<AuthSessionUser, 'user_role'>): AuthSessionUser {
  const accounts = readAccounts();
  const existing = accounts.find((account) => account.user_id === user.user_id);
  const session: AuthSessionUser = {
    ...user,
    user_role: existing?.user_role ?? null,
  };
  const account: StoredAccount = {
    ...session,
    created_at: existing?.created_at ?? user.last_login_at,
  };
  const nextAccounts = existing
    ? accounts.map((item) => item.user_id === user.user_id ? account : item)
    : [...accounts, account];

  localStorage.setItem(AUTH_ACCOUNTS_KEY, JSON.stringify(nextAccounts));
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  if (session.user_role) {
    localStorage.setItem('user_role', session.user_role);
  } else {
    localStorage.removeItem('user_role');
  }
  notifyAuthChange();

  return session;
}

export function updateCurrentUserRole(userRole: UserRole) {
  const session = getAuthSession();
  if (!session) return;

  const nextSession = { ...session, user_role: userRole };
  const accounts = readAccounts();
  const nextAccounts = accounts.map((account) =>
    account.user_id === session.user_id ? { ...account, user_role: userRole } : account
  );

  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(nextSession));
  localStorage.setItem(AUTH_ACCOUNTS_KEY, JSON.stringify(nextAccounts));
  localStorage.setItem('user_role', userRole);
  notifyAuthChange();
}

export function updateCurrentUserDetails(details: Partial<Pick<AuthSessionUser, 'username' | 'phone' | 'phone_full'>>) {
  const session = getAuthSession();
  if (!session) return;

  const nextSession = { ...session, ...details };
  const accounts = readAccounts();
  const nextAccounts = accounts.map((account) =>
    account.user_id === session.user_id ? { ...account, ...details } : account
  );

  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(nextSession));
  localStorage.setItem(AUTH_ACCOUNTS_KEY, JSON.stringify(nextAccounts));
  notifyAuthChange();
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_SESSION_KEY);
  localStorage.removeItem('user_role');
  notifyAuthChange();
}

export function getAvatarInitial(username: string): string {
  const firstCharacter = Array.from(username.trim())[0] || '?';
  return /^[a-z]$/i.test(firstCharacter) ? firstCharacter.toUpperCase() : firstCharacter;
}
