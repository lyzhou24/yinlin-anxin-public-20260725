'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { getAuthSession, type AuthSessionUser } from '@/lib/auth-session';

export default function ProfileSetupPage() {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<AuthSessionUser | null>(null);
  const [birthYear, setBirthYear] = useState('');
  const [hasChronicDisease, setHasChronicDisease] = useState('');
  const [chronicDiseases, setChronicDiseases] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const session = getAuthSession();
    if (!session || session.user_role !== 'elder') {
      router.replace('/role-select');
      return;
    }
    setAuthUser(session);
  }, [router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!authUser || !birthYear || !hasChronicDisease || (hasChronicDisease === 'yes' && !chronicDiseases.trim())) return;
    setIsSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(authUser.user_id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authUser.username,
          phone: authUser.phone,
          user_role: 'elder',
          birth_year: Number(birthYear),
          has_chronic_disease: hasChronicDisease === 'yes',
          chronic_diseases: hasChronicDisease === 'yes' ? chronicDiseases.trim() : undefined,
          profile_completed: true,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        setError(json.error_message || '资料保存失败，请稍后重试。');
        return;
      }
      router.push('/family-bind');
    } catch {
      setError('网络连接失败，资料尚未保存。');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="完善老人信息"
        subtitle="这些信息用于显示更合适的健康提醒。"
        backHref="/role-select"
      />
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 mb-6">
        <label htmlFor="birth-year" className="block text-lg font-bold text-foreground mb-2">
          出生年份
        </label>
        <input
          id="birth-year"
          type="number"
          min="1900"
          max={new Date().getFullYear()}
          value={birthYear}
          onChange={(event) => setBirthYear(event.target.value)}
          placeholder="例如：1955"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-6"
          required
        />

        <fieldset className="mb-6">
          <legend className="text-lg font-bold text-foreground mb-3">是否有基础疾病</legend>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex flex-1 items-center gap-3 rounded-xl border border-border p-4 cursor-pointer">
              <input
                type="radio"
                name="has-chronic-disease"
                value="yes"
                checked={hasChronicDisease === 'yes'}
                onChange={(event) => setHasChronicDisease(event.target.value)}
                className="h-5 w-5 accent-primary"
                required
              />
              <span className="text-base text-foreground">有基础疾病</span>
            </label>
            <label className="flex flex-1 items-center gap-3 rounded-xl border border-border p-4 cursor-pointer">
              <input
                type="radio"
                name="has-chronic-disease"
                value="no"
                checked={hasChronicDisease === 'no'}
                onChange={(event) => setHasChronicDisease(event.target.value)}
                className="h-5 w-5 accent-primary"
                required
              />
              <span className="text-base text-foreground">暂无基础疾病</span>
            </label>
          </div>
          {hasChronicDisease === 'yes' && (
            <div className="mt-4">
              <label htmlFor="chronic-diseases" className="block text-base font-semibold text-foreground mb-2">
                请输入具体的基础疾病
              </label>
              <textarea
                id="chronic-diseases"
                value={chronicDiseases}
                onChange={(event) => setChronicDiseases(event.target.value)}
                rows={3}
                maxLength={200}
                placeholder="例如：高血压、糖尿病"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          )}
        </fieldset>

        {error && (
          <p className="mb-4 rounded-xl bg-red-50 p-3 text-base text-red-700" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={isSaving || !birthYear || !hasChronicDisease || (hasChronicDisease === 'yes' && !chronicDiseases.trim())}
          className="w-full rounded-xl bg-primary px-8 py-4 text-xl font-semibold text-primary-foreground disabled:opacity-40"
        >
          {isSaving ? '正在保存……' : '保存并绑定家属'}
        </button>
      </form>
    </div>
  );
}
