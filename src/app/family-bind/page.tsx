'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { MOCK_USER_PROFILE_ELDER, MOCK_USER_PROFILE_FAMILY, MOCK_FAMILY_INVITE, MOCK_FAMILY_BIND_SAMPLE_CODE, MOCK_FAMILY_RELATION, MOCK_FAMILY_RELATIONS, getMockUserProfile } from '@/lib/mock-data';
import { RELATION_TYPE_LABELS } from '@/lib/types';
import type { UserRole, RelationType, FamilyRelation } from '@/lib/types';
import { getAuthSession } from '@/lib/auth-session';

// 模拟当前角色，实际应由接口返回
function getCurrentRole(): UserRole {
  if (typeof window === 'undefined') return 'elder';
  return (localStorage.getItem('user_role') as UserRole) || 'elder';
}

export default function FamilyBindPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>('elder');
  const [authChecked, setAuthChecked] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [countdown, setCountdown] = useState(600);
  const [inputCode, setInputCode] = useState('');
  const [selectedRelation, setSelectedRelation] = useState<RelationType>('child');
  const [permissions, setPermissions] = useState(MOCK_FAMILY_RELATION.permissions);
  const [familyRelations, setFamilyRelations] = useState<FamilyRelation[]>(
    MOCK_FAMILY_RELATIONS.filter((relation) => relation.family_user_id === MOCK_USER_PROFILE_FAMILY.user_id)
  );
  const [relationToRevoke, setRelationToRevoke] = useState<FamilyRelation | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [revokeSuccess, setRevokeSuccess] = useState(false);
  const [showDevelopmentNotice, setShowDevelopmentNotice] = useState(false);
  const [bindSuccess, setBindSuccess] = useState('');
  const [bindError, setBindError] = useState('');

  useEffect(() => {
    if (!getAuthSession()?.user_role) {
      router.replace('/login');
      return;
    }
    setRole(getCurrentRole());
    setAuthChecked(true);
  }, [router]);

  useEffect(() => {
    if (role !== 'elder') return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [role]);

  useEffect(() => {
    if (role !== 'family') return;

    fetch(`/api/family/relations?family_user_id=${MOCK_USER_PROFILE_FAMILY.user_id}`)
      .then((response) => response.json())
      .then((json) => {
        if (json.success) {
          setFamilyRelations(json.data.relations as FamilyRelation[]);
        }
      });
  }, [role]);

  useEffect(() => {
    if (!revokeSuccess) return;
    const timer = window.setTimeout(() => setRevokeSuccess(false), 3000);
    return () => window.clearTimeout(timer);
  }, [revokeSuccess]);

  useEffect(() => {
    if (!bindSuccess) return;
    const timer = window.setTimeout(() => setBindSuccess(''), 3000);
    return () => window.clearTimeout(timer);
  }, [bindSuccess]);

  const generateCode = () => {
    setInviteCode(MOCK_FAMILY_INVITE.invite_code);
    setCountdown(600);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const togglePermission = (key: keyof typeof permissions) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmitBindApplication = () => {
    if (inputCode === MOCK_FAMILY_BIND_SAMPLE_CODE) {
      setBindError('');
      fetch('/api/family/relations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invite_code: inputCode,
          family_user_id: MOCK_USER_PROFILE_FAMILY.user_id,
          relation_type: selectedRelation,
        }),
      })
        .then((response) => response.json().then((json) => ({ response, json })))
        .then(({ response, json }) => {
          if (!response.ok || !json.success) {
            setBindError(json.error_message || '绑定失败，请稍后重试。');
            return;
          }
          const relation = json.data.relation as FamilyRelation;
          setFamilyRelations((prev) =>
            prev.some((item) => item.relation_id === relation.relation_id)
              ? prev
              : [...prev, relation]
          );
          localStorage.setItem(`yinling_family_access:${relation.elder_user_id}`, 'active');
          setInputCode('');
          setBindSuccess(`绑定成功，已添加${getMockUserProfile(relation.elder_user_id)?.display_name || '老人'}。`);
        })
        .catch(() => setBindError('网络连接失败，绑定未完成。'));
      return;
    }
    setShowDevelopmentNotice(true);
  };

  const handleConfirmRevoke = async () => {
    if (!relationToRevoke) return;

    setIsRevoking(true);
    setRevokeError(null);
    try {
      const response = await fetch(`/api/family/relations/${encodeURIComponent(relationToRevoke.relation_id)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ family_user_id: MOCK_USER_PROFILE_FAMILY.user_id }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        setRevokeError(json.error_message || '解除绑定失败，请稍后重试。');
        return;
      }

      setFamilyRelations((prev) =>
        prev.filter((relation) => relation.relation_id !== relationToRevoke.relation_id)
      );
      setPermissions({
        receive_red_alert: false,
        view_family_report: false,
        upload_for_elder: false,
        view_history_summary: false,
        view_original_image: false,
        view_financial_details: false,
      });
      localStorage.setItem(`yinling_family_access:${relationToRevoke.elder_user_id}`, 'revoked');
      setRelationToRevoke(null);
      setRevokeSuccess(true);
    } catch {
      setRevokeError('网络连接失败，解除绑定未完成。');
    } finally {
      setIsRevoking(false);
    }
  };

  const elderFamilyRelations = MOCK_FAMILY_RELATIONS.filter(
    (relation) => relation.elder_user_id === MOCK_USER_PROFILE_ELDER.user_id
  );

  if (!authChecked) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-lg text-muted-foreground">正在检查登录状态……</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="家庭绑定"
        subtitle="邀请家人一起守护，或输入绑定码加入家庭"
        backHref="/"
      />

      {role === 'elder' ? (
        <>
          {/* 老人端：生成绑定码 */}
          <div className="bg-card border-2 border-border rounded-2xl p-6 mb-6 text-center">
            <h3 className="text-xl font-bold text-foreground mb-4">邀请家人一起守护</h3>
            <p className="text-base text-muted-foreground mb-6">
              点击生成绑定码，口头、电话或当面告诉可信家属。
            </p>
            {!inviteCode ? (
              <button
                onClick={generateCode}
                className="bg-primary text-primary-foreground rounded-xl px-8 py-4 text-xl font-semibold hover:opacity-90 transition-opacity"
              >
                生成绑定码
              </button>
            ) : (
              <div className="space-y-4">
                <div className="bg-primary/10 border-2 border-primary rounded-2xl p-6">
                  <p className="text-4xl font-bold text-primary tracking-widest">{inviteCode}</p>
                  <p className="text-base text-muted-foreground mt-2">
                    有效期：{formatTime(countdown)}
                  </p>
                </div>
                <button
                  onClick={generateCode}
                  className="bg-secondary text-secondary-foreground rounded-xl px-6 py-3 text-base font-semibold hover:opacity-90 transition-opacity"
                >
                  重新生成
                </button>
              </div>
            )}
          </div>

          {/* 权限授权 */}
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <h3 className="text-xl font-bold text-foreground mb-4">授权家人可以做什么</h3>
            <div className="space-y-3">
              {[
                { key: 'receive_red_alert' as const, label: '接收红色风险预警' },
                { key: 'view_family_report' as const, label: '查看家属简报摘要' },
                { key: 'upload_for_elder' as const, label: '代我上传材料' },
                { key: 'view_history_summary' as const, label: '查看历史记录摘要' },
                { key: 'view_original_image' as const, label: '查看上传原图' },
                { key: 'view_financial_details' as const, label: '查看付款金额和账户信息' },
              ].map((item) => (
                <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions[item.key]}
                    onChange={() => togglePermission(item.key)}
                    className="w-5 h-5 accent-primary"
                  />
                  <span className="text-base text-foreground">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 已绑定成员 */}
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <h3 className="text-xl font-bold text-foreground mb-4">已绑定家人</h3>
            <div className="space-y-3">
              {elderFamilyRelations.map((relation) => (
                <div key={relation.relation_id} className="border border-border rounded-xl p-4">
                  <p className="text-base text-foreground">
                    <strong>{getMockUserProfile(relation.family_user_id)?.display_name || '家庭成员'}</strong>
                    （{RELATION_TYPE_LABELS[relation.relation_type]}）
                  </p>
                  <p className="text-base text-muted-foreground mt-1">状态：已绑定</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* 家属端：输入绑定码 */}
          <div className="bg-card border-2 border-border rounded-2xl p-6 mb-6">
            <h3 className="text-xl font-bold text-foreground mb-4">绑定老人账户</h3>
            <p className="text-base text-muted-foreground mb-4">
              请输入老人提供的6位绑定码。
            </p>
            <p className="mb-4 rounded-xl bg-primary/10 px-4 py-3 text-base font-semibold text-primary">
              本地测试绑定码：{MOCK_FAMILY_BIND_SAMPLE_CODE}
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="6位绑定码"
              className="w-full rounded-xl border border-border bg-background px-4 py-4 text-2xl text-center tracking-widest text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-4"
            />
            <div className="mb-4">
              <label className="block text-base font-semibold text-foreground mb-2">
                选择与老人的关系
              </label>
              <select
                value={selectedRelation}
                onChange={(e) => setSelectedRelation(e.target.value as RelationType)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {Object.entries(RELATION_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleSubmitBindApplication}
              disabled={inputCode.length !== 6}
              className="w-full bg-primary text-primary-foreground rounded-xl px-8 py-4 text-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              提交绑定申请
            </button>
            {bindSuccess && (
              <p className="mt-4 rounded-xl bg-green-50 p-3 text-base font-semibold text-green-700" role="status">
                {bindSuccess}
              </p>
            )}
            {bindError && (
              <p className="mt-4 rounded-xl bg-red-50 p-3 text-base font-semibold text-red-700" role="alert">
                {bindError}
              </p>
            )}
          </div>

          {/* 已绑定老人 */}
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <h3 className="text-xl font-bold text-foreground mb-4">已绑定老人</h3>
            {revokeSuccess && (
              <p className="mb-4 rounded-xl bg-green-50 p-3 text-base font-semibold text-green-700" role="status">
                已解除绑定，对该老人的访问权限已撤销。
              </p>
            )}
            {familyRelations.length > 0 ? (
              <div className="space-y-3">
                {familyRelations.map((relation) => (
                  <div key={relation.relation_id} className="flex flex-col gap-3 border border-border rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-base text-foreground">
                        <strong>{getMockUserProfile(relation.elder_user_id)?.display_name || MOCK_USER_PROFILE_ELDER.display_name}</strong>
                      </p>
                      <p className="text-base text-muted-foreground mt-1">
                        状态：{relation.status === 'active' ? '已绑定' : '待确认'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setRevokeError(null);
                        setRelationToRevoke(relation);
                      }}
                      className="rounded-xl border-2 border-red-200 bg-white px-5 py-3 text-base font-semibold text-red-700 hover:bg-red-50 transition-colors"
                    >
                      解除绑定
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl bg-muted/40 p-4 text-base text-muted-foreground">
                暂无已绑定老人。
              </p>
            )}
          </div>
        </>
      )}

      <Link
        href="/"
        className="mt-6 block w-full bg-muted text-foreground rounded-xl px-8 py-4 text-xl font-semibold text-center hover:opacity-90 transition-opacity"
      >
        返回首页
      </Link>

      {relationToRevoke && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-5" role="dialog" aria-modal="true" aria-labelledby="revoke-title">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <h2 id="revoke-title" className="text-xl font-bold text-foreground mb-3">
              确认解除绑定？
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-5">
              解除后，您将立即失去对该老人材料、简报、历史记录和预警信息的访问权限。
            </p>
            {revokeError && (
              <p className="mb-4 rounded-xl bg-red-50 p-3 text-base text-red-700" role="alert">
                {revokeError}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRelationToRevoke(null)}
                disabled={isRevoking}
                className="flex-1 rounded-xl bg-muted px-4 py-3 text-base font-semibold text-foreground disabled:opacity-40"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmRevoke}
                disabled={isRevoking}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-base font-semibold text-white disabled:opacity-40"
              >
                {isRevoking ? '正在解除……' : '确认解除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDevelopmentNotice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-5" role="dialog" aria-modal="true" aria-labelledby="development-title">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <h2 id="development-title" className="text-xl font-bold text-foreground mb-5">
              功能持续开发中
            </h2>
            <button
              type="button"
              onClick={() => setShowDevelopmentNotice(false)}
              className="w-full rounded-xl bg-primary px-5 py-3 text-lg font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
