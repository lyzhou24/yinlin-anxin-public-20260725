import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';

export default function ForbiddenPage() {
  return (
    <div>
      <PageHeader title="暂时没有查看权限" backHref="/" />
      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 text-center">
        <p className="text-xl font-semibold text-amber-900 mb-3">
          当前身份不能查看这个页面
        </p>
        <p className="text-base text-amber-800 leading-relaxed mb-5">
          请返回首页使用当前身份可用的功能；家庭权限需要调整时，可前往家庭绑定页面。
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="flex-1 bg-primary text-primary-foreground rounded-xl px-6 py-3 text-lg font-semibold text-center"
          >
            返回首页
          </Link>
          <Link
            href="/family-bind"
            className="flex-1 bg-secondary text-secondary-foreground rounded-xl px-6 py-3 text-lg font-semibold text-center"
          >
            家庭绑定
          </Link>
        </div>
      </div>
    </div>
  );
}
