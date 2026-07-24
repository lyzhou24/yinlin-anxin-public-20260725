'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { MOCK_USER_ACCOUNT, MOCK_USER_PROFILE_ELDER, MOCK_USER_PROFILE_FAMILY, getMockUserProfile } from '@/lib/mock-data';
import { USER_ROLE_LABELS, RELATION_TYPE_LABELS } from '@/lib/types';
import type { FamilyPermissions, FamilyRelation, UserProfile, UserRole } from '@/lib/types';
import { clearAuthSession, getAuthSession, updateCurrentUserDetails, type AuthSessionUser } from '@/lib/auth-session';

const PERMISSION_LABELS: Record<keyof FamilyPermissions, string> = {
  receive_red_alert: '接收红色风险预警',
  view_family_report: '查看家属简报摘要',
  upload_for_elder: '代老人上传材料',
  view_history_summary: '查看历史记录摘要',
  view_original_image: '查看上传原图',
  view_financial_details: '查看付款金额和账户信息',
};

function getCurrentRole(): UserRole {
  if (typeof window === 'undefined') return 'elder';
  return (localStorage.getItem('user_role') as UserRole) || 'elder';
}

export default function AccountPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>('elder');
  const [authUser, setAuthUser] = useState<AuthSessionUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [retentionDays, setRetentionDays] = useState('30');
  const [retentionKey, setRetentionKey] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [familyRelations, setFamilyRelations] = useState<FamilyRelation[]>([]);
  const [editField, setEditField] = useState<'username' | 'phone' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [editError, setEditError] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [permissionRelation, setPermissionRelation] = useState<FamilyRelation | null>(null);
  const [draftPermissions, setDraftPermissions] = useState<FamilyPermissions | null>(null);
  const [permissionError, setPermissionError] = useState('');
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  useEffect(() => {
    const session = getAuthSession();
    if (!session?.user_role) {
      router.replace('/login');
      return;
    }
    setAuthUser(session);
    const currentRole = getCurrentRole();
    setRole(currentRole);
    setProfile(currentRole === 'elder' ? MOCK_USER_PROFILE_ELDER : MOCK_USER_PROFILE_FAMILY);
    const key = `yinling_retention_days:${session.user_id}`;
    setRetentionKey(key);
    setRetentionDays(localStorage.getItem(key) || '30');
    setAuthChecked(true);
    fetch(`/api/users/${encodeURIComponent(session.user_id)}`)
      .then((response) => response.json())
      .then((json) => {
        if (json.success) setProfile(json.data.profile as UserProfile);
      });
    const relationQuery = currentRole === 'family'
      ? `family_user_id=${encodeURIComponent(MOCK_USER_PROFILE_FAMILY.user_id)}`
      : `elder_user_id=${encodeURIComponent(MOCK_USER_PROFILE_ELDER.user_id)}`;
    fetch(`/api/family/relations?${relationQuery}`)
      .then((response) => response.json())
      .then((json) => {
        if (json.success) setFamilyRelations(json.data.relations as FamilyRelation[]);
      });
  }, [router]);

  const handleLogout = () => {
    clearAuthSession();
    router.push('/login');
  };

  const openAccountEdit = (field: 'username' | 'phone') => {
    setEditField(field);
    setEditValue(field === 'username' ? authUser?.username || '' : '');
    setVerificationCode('');
    setEditError('');
  };

  const handleSaveAccountEdit = async () => {
    if (!editField || !authUser) return;
    setIsSavingEdit(true);
    setEditError('');
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(authUser.user_id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: editField === 'username' ? editValue : authUser.username,
          phone: editField === 'phone' ? editValue : authUser.phone,
          verification_code: editField === 'phone' ? verificationCode : undefined,
          user_role: role,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        setEditError(json.error_message || '资料修改失败，请稍后重试。');
        return;
      }
      const account = json.data.account as AuthSessionUser;
      const fullPhone = editField === 'phone' ? editValue : authUser.phone_full;
      setAuthUser((current) => current ? { ...current, username: account.username, phone: account.phone, phone_full: fullPhone } : current);
      setProfile(json.data.profile as UserProfile);
      updateCurrentUserDetails({ username: account.username, phone: account.phone, phone_full: fullPhone });
      setEditField(null);
    } catch {
      setEditError('网络连接失败，资料尚未修改。');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const openPermissionEdit = (relation: FamilyRelation) => {
    setPermissionRelation(relation);
    setDraftPermissions({ ...relation.permissions });
    setPermissionError('');
  };

  const handleSavePermissions = async () => {
    if (!permissionRelation || !draftPermissions) return;
    setIsSavingPermissions(true);
    setPermissionError('');
    try {
      const response = await fetch(`/api/family/relations/${encodeURIComponent(permissionRelation.relation_id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family_user_id: permissionRelation.family_user_id,
          permissions: draftPermissions,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        setPermissionError(json.error_message || '权限修改失败，请稍后重试。');
        return;
      }
      const updatedRelation = json.data.relation as FamilyRelation;
      setFamilyRelations((current) => current.map((relation) =>
        relation.relation_id === updatedRelation.relation_id ? updatedRelation : relation
      ));
      setPermissionRelation(null);
      setDraftPermissions(null);
    } catch {
      setPermissionError('网络连接失败，权限尚未修改。');
    } finally {
      setIsSavingPermissions(false);
    }
  };

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
        title="账户中心"
        subtitle="查看和管理您的账户、身份与家庭成员"
        backHref="/"
      />

      {/* 基本资料 */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-4">
        <h3 className="text-xl font-bold text-foreground mb-4">基本资料</h3>
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
            <span className="text-muted-foreground text-base shrink-0 sm:w-24">用户名：</span>
            <span className="text-foreground text-base">{authUser?.username || MOCK_USER_ACCOUNT.username}</span>
            <button
              type="button"
              onClick={() => openAccountEdit('username')}
              className="text-lg leading-none text-gray-400 hover:text-gray-600"
              aria-label="修改用户名"
              title="修改用户名"
            >
              ✎
            </button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
            <span className="text-muted-foreground text-base shrink-0 sm:w-24">账户ID：</span>
            <span className="text-foreground text-base">{authUser?.user_id || MOCK_USER_ACCOUNT.user_id}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
            <span className="text-muted-foreground text-base shrink-0 sm:w-24">手机号：</span>
            <span className="text-foreground text-base">{authUser?.phone || MOCK_USER_ACCOUNT.phone}</span>
            <button
              type="button"
              onClick={() => openAccountEdit('phone')}
              className="text-lg leading-none text-gray-400 hover:text-gray-600"
              aria-label="修改手机号"
              title="修改手机号"
            >
              ✎
            </button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
            <span className="text-muted-foreground text-base shrink-0 sm:w-24">当前身份：</span>
            <span className="text-foreground text-base font-semibold">{USER_ROLE_LABELS[role]}</span>
          </div>
          {role === 'elder' && profile?.birth_year && (
            <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
              <span className="text-muted-foreground text-base shrink-0 sm:w-24">出生年份：</span>
              <span className="text-foreground text-base">{profile.birth_year}年</span>
            </div>
          )}
          {role === 'elder' && profile?.has_chronic_disease !== undefined && (
            <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
              <span className="text-muted-foreground text-base shrink-0 sm:w-24">基础疾病：</span>
              <span className="text-foreground text-base">
                {profile.has_chronic_disease ? profile.chronic_diseases || '有（尚未填写具体疾病）' : '暂无'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 家庭成员与权限 */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-4">
        <h3 className="text-xl font-bold text-foreground mb-4">家庭成员与权限</h3>
        {familyRelations.length > 0 ? (
          <div className="space-y-4">
            {familyRelations.map((relation) => {
              const member = getMockUserProfile(
                role === 'family' ? relation.elder_user_id : relation.family_user_id
              );
              return (
                <div key={relation.relation_id} className="border border-border rounded-xl p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-base text-foreground">
                        <strong>{member?.display_name || '家庭成员'}</strong>
                        <span className="ml-2 text-muted-foreground">
                          （{RELATION_TYPE_LABELS[relation.relation_type]}）
                        </span>
                      </p>
                      <p className="text-base text-muted-foreground mt-1">状态：已绑定</p>
                    </div>
                    {role === 'family' && (
                      <button
                        type="button"
                        onClick={() => openPermissionEdit(relation)}
                        className="rounded-xl border border-border bg-white px-4 py-2 text-base font-semibold text-foreground hover:bg-muted"
                      >
                        修改权限
                      </button>
                    )}
                  </div>
                  {role !== 'family' && (
                    <div className="mt-4 space-y-2 border-t border-border pt-3">
                      {Object.entries(relation.permissions).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between gap-4 text-base">
                          <span className="text-foreground">{PERMISSION_LABELS[key as keyof FamilyPermissions]}</span>
                          <span className={value ? 'text-green-700 font-semibold' : 'text-muted-foreground'}>
                            {value ? '已开启' : '已关闭'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="rounded-xl bg-muted/40 p-4 text-base text-muted-foreground">暂无已绑定家庭成员。</p>
        )}
        {role === 'family' ? (
          <Link
            href="/family-bind"
            className="inline-block mt-4 text-primary text-base underline underline-offset-4"
          >
            管理家庭绑定
          </Link>
        ) : (
          <p className="mt-4 rounded-xl bg-amber-50 p-4 text-base text-amber-800 leading-relaxed">
            如需解绑或修改权限，请联系子女在家属/照护者端进行解绑或修改。
          </p>
        )}
      </div>

      {/* 数据保存期限 */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-4">
        <h3 className="text-xl font-bold text-foreground mb-4">数据保存期限</h3>
        <label className="block text-base text-foreground mb-2">分析记录保存时间</label>
        <select
          value={retentionDays}
          onChange={(e) => {
            setRetentionDays(e.target.value);
            if (retentionKey) localStorage.setItem(retentionKey, e.target.value);
          }}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="7">7 天</option>
          <option value="30">30 天</option>
          <option value="90">90 天</option>
          <option value="forever">永久保存</option>
        </select>
        <p className="mt-2 text-sm text-muted-foreground">当前仅保存浏览器偏好；真实到期删除需接入服务端记录库。</p>
      </div>

      {/* 退出登录 */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <h3 className="text-xl font-bold text-foreground mb-4">退出登录</h3>
        <p className="text-base text-muted-foreground mb-4">
          退出后需要重新登录才能查看您的记录。
        </p>
        <button
          onClick={handleLogout}
          className="w-full bg-red-50 text-red-700 border border-red-200 rounded-xl px-5 py-3 text-lg font-semibold hover:bg-red-100 transition-colors"
        >
          退出登录
        </button>
      </div>

      <Link
        href="/"
        className="mb-6 block w-full bg-muted text-foreground rounded-xl px-8 py-4 text-xl font-semibold text-center hover:opacity-90 transition-opacity"
      >
        返回首页
      </Link>

      {editField && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-5" role="dialog" aria-modal="true" aria-labelledby="account-edit-title">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 id="account-edit-title" className="text-xl font-bold text-foreground mb-4">
              修改{editField === 'username' ? '用户名' : '手机号'}
            </h2>
            <input
              type={editField === 'phone' ? 'tel' : 'text'}
              inputMode={editField === 'phone' ? 'numeric' : undefined}
              value={editValue}
              onChange={(event) => setEditValue(event.target.value)}
              placeholder={editField === 'phone' ? '请输入11位新手机号' : '请输入新用户名'}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {editField === 'phone' && (
              <div className="mt-4">
                <label htmlFor="phone-verification-code" className="block text-base font-semibold text-foreground mb-2">
                  验证码
                </label>
                <input
                  id="phone-verification-code"
                  type="text"
                  inputMode="numeric"
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value)}
                  placeholder="请输入验证码"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="mt-2 text-sm text-muted-foreground">中期测试验证码：123456</p>
              </div>
            )}
            {editError && (
              <p className="mt-3 rounded-xl bg-red-50 p-3 text-base text-red-700" role="alert">{editError}</p>
            )}
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={() => setEditField(null)}
                disabled={isSavingEdit}
                className="flex-1 rounded-xl bg-muted px-4 py-3 text-base font-semibold text-foreground disabled:opacity-40"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveAccountEdit}
                disabled={isSavingEdit || !editValue.trim() || (editField === 'phone' && !verificationCode.trim())}
                className="flex-1 rounded-xl bg-primary px-4 py-3 text-base font-semibold text-primary-foreground disabled:opacity-40"
              >
                {isSavingEdit ? '保存中……' : '保存修改'}
              </button>
            </div>
          </div>
        </div>
      )}

      {permissionRelation && draftPermissions && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-5" role="dialog" aria-modal="true" aria-labelledby="permission-edit-title">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 id="permission-edit-title" className="text-xl font-bold text-foreground mb-2">修改老人权限</h2>
            <p className="text-base text-muted-foreground mb-4">
              当前老人：{getMockUserProfile(permissionRelation.elder_user_id)?.display_name || '老人'}
            </p>
            <div className="space-y-3">
              {(Object.keys(draftPermissions) as Array<keyof FamilyPermissions>).map((key) => (
                <label key={key} className="flex items-center gap-3 rounded-xl border border-border p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draftPermissions[key]}
                    onChange={() => setDraftPermissions((current) =>
                      current ? { ...current, [key]: !current[key] } : current
                    )}
                    className="h-5 w-5 accent-primary"
                  />
                  <span className="text-base text-foreground">{PERMISSION_LABELS[key]}</span>
                </label>
              ))}
            </div>
            {permissionError && (
              <p className="mt-3 rounded-xl bg-red-50 p-3 text-base text-red-700" role="alert">{permissionError}</p>
            )}
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={() => setPermissionRelation(null)}
                disabled={isSavingPermissions}
                className="flex-1 rounded-xl bg-muted px-4 py-3 text-base font-semibold text-foreground disabled:opacity-40"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSavePermissions}
                disabled={isSavingPermissions}
                className="flex-1 rounded-xl bg-primary px-4 py-3 text-base font-semibold text-primary-foreground disabled:opacity-40"
              >
                {isSavingPermissions ? '保存中……' : '确定更改'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
