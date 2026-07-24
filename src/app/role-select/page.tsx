'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { UserRole } from '@/lib/types';
import { updateCurrentUserRole } from '@/lib/auth-session';

export default function RoleSelectPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = () => {
    if (!selectedRole) return;
    setIsLoading(true);
    // 模拟保存身份
    localStorage.setItem('user_role', selectedRole);
    updateCurrentUserRole(selectedRole);
    setTimeout(() => {
      setIsLoading(false);
      router.push(selectedRole === 'elder' ? '/profile-setup' : '/family-bind');
    }, 500);
  };

  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-3">请选择您的身份</h1>
        <p className="text-lg text-muted-foreground">身份选择后，页面会展示适合您的入口。</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto mb-8">
        <button
          type="button"
          onClick={() => setSelectedRole('elder')}
          className={`text-left rounded-2xl border-2 p-6 transition-all hover:border-primary ${
            selectedRole === 'elder'
              ? 'border-primary bg-primary/5'
              : 'border-border bg-card'
          }`}
        >
          <span className="text-5xl block mb-4" aria-hidden="true">👴</span>
          <h2 className="text-2xl font-bold text-foreground mb-2">我是老人本人</h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            查看自己的药品、防骗结果和家属提醒状态。
          </p>
        </button>

        <button
          type="button"
          onClick={() => setSelectedRole('family')}
          className={`text-left rounded-2xl border-2 p-6 transition-all hover:border-primary ${
            selectedRole === 'family'
              ? 'border-primary bg-primary/5'
              : 'border-border bg-card'
          }`}
        >
          <span className="text-5xl block mb-4" aria-hidden="true">👨‍👩‍👧‍👦</span>
          <h2 className="text-2xl font-bold text-foreground mb-2">我是家属/照护者</h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            绑定老人后，代为上传并接收获授权的风险提醒。
          </p>
        </button>
      </div>

      <div className="max-w-2xl mx-auto">
        <p className="text-base text-muted-foreground text-center mb-6">
          医生/药师不需要在此选择身份，可通过老人或家属展示系统结果进行线下沟通。
        </p>
        <button
          onClick={handleConfirm}
          disabled={!selectedRole || isLoading}
          className="w-full bg-primary text-primary-foreground rounded-xl px-8 py-4 text-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? '保存中……' : '确认身份'}
        </button>
      </div>
    </div>
  );
}
