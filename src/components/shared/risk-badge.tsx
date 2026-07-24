'use client';

import type { RiskLevel } from '@/lib/types';
import { RISK_LEVEL_LABELS } from '@/lib/types';

interface RiskBadgeProps {
  level: RiskLevel;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const LEVEL_STYLES: Record<RiskLevel, { bg: string; border: string; icon: string; text: string }> = {
  green: {
    bg: 'bg-green-50',
    border: 'border-green-400',
    icon: '✅',
    text: 'text-green-700',
  },
  yellow: {
    bg: 'bg-amber-50',
    border: 'border-amber-400',
    icon: '⚠️',
    text: 'text-amber-700',
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-400',
    icon: '🛑',
    text: 'text-red-700',
  },
};

const SIZE_STYLES = {
  sm: 'px-3 py-1 text-base',
  md: 'px-4 py-2 text-lg',
  lg: 'px-5 py-3 text-xl',
};

export function RiskBadge({ level, showLabel = true, size = 'md' }: RiskBadgeProps) {
  const style = LEVEL_STYLES[level];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-lg border-2 font-semibold ${style.bg} ${style.border} ${style.text} ${SIZE_STYLES[size]}`}
      role="status"
      aria-label={`风险等级：${RISK_LEVEL_LABELS[level]}`}
    >
      <span className="text-xl" aria-hidden="true">{style.icon}</span>
      {showLabel && <span>{RISK_LEVEL_LABELS[level]}</span>}
    </span>
  );
}
