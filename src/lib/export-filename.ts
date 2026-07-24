import type { AuthSessionUser } from './auth-session';

function safeFilenamePart(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, '-').trim() || '未命名';
}

function exportTime(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

export function getExportSourceLabel(account: AuthSessionUser | null): string {
  if (account?.user_role === 'elder') return '老人端';
  return /护工|照护|护理/.test(account?.username || '') ? '照护者端' : '家属端';
}

export function buildExportFilename(
  account: AuthSessionUser | null,
  fileType: string,
  extension?: string
): string {
  const base = [
    safeFilenamePart(account?.username || '未登录账户'),
    safeFilenamePart(fileType),
    exportTime(),
    getExportSourceLabel(account),
  ].join('_');
  return extension ? `${base}.${extension}` : base;
}
