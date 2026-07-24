'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
}

export function PageHeader({ title, subtitle, backHref, backLabel = '返回上一级' }: PageHeaderProps) {
  const router = useRouter();
  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <div className="mb-6">
      {backHref === '/' ? (
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1 text-primary hover:opacity-80 transition-opacity text-base mb-3"
        >
          <span aria-hidden="true">←</span>
          {backLabel}
        </button>
      ) : backHref ? (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-primary hover:opacity-80 transition-opacity text-base mb-3"
        >
          <span aria-hidden="true">←</span>
          {backLabel}
        </Link>
      ) : null}
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">{title}</h1>
      {subtitle && (
        <p className="mt-2 text-muted-foreground text-lg leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}
