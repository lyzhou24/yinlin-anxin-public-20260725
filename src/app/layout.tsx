import Link from 'next/link';
import type { Metadata } from 'next';
import { AuthNav } from '@/components/shared/auth-nav';
import { ProtectedRouteGuard } from '@/components/shared/protected-route-guard';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '银龄安心',
    template: '%s | 银龄安心',
  },
  description: '帮长辈看懂用药信息，识别健康消费风险',
  keywords: ['银龄安心', '用药解读', '健康消费', '防骗', '老年人'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.COZE_PROJECT_ENV === 'DEV';

  return (
    <html lang="zh-CN">
      <body className="antialiased min-h-screen flex flex-col">
        {isDev && process.env.NODE_ENV === 'development' && (
          <></>
        )}
        {/* 顶部导航 */}
        <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
          <div className="max-w-[960px] mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-primary font-bold text-xl hover:opacity-80 transition-opacity">
              <span className="text-2xl" role="img" aria-label="银龄安心图标">🛡️</span>
              <span>银龄安心</span>
            </Link>
            <nav className="flex items-center gap-4">
              <AuthNav />
            </nav>
          </div>
        </header>

        {/* 主内容区 */}
        <main className="flex-1">
          <div className="max-w-[960px] mx-auto px-4 py-6">
            <ProtectedRouteGuard>{children}</ProtectedRouteGuard>
          </div>
        </main>

        {/* 底部 */}
        <footer className="border-t border-border bg-white">
          <div className="max-w-[960px] mx-auto px-4 py-4 text-center text-muted-foreground text-base">
            <p>银龄安心 — 帮长辈看懂用药信息，识别健康消费风险</p>
            <p className="mt-1">
              <Link href="/privacy" className="underline hover:text-primary transition-colors">
                隐私与使用说明
              </Link>
              <span className="mx-2">·</span>
              <Link href="/feedback" className="underline hover:text-primary transition-colors">
                意见反馈
              </Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
