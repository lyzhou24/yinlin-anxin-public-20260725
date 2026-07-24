'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { FamilyRelation, UserProfile, UserRole } from '@/lib/types';
import { USER_ROLE_LABELS } from '@/lib/types';
import { clearAuthSession, getAuthSession } from '@/lib/auth-session';
import { MOCK_USER_PROFILE_FAMILY, getMockUserProfile } from '@/lib/mock-data';

export default function HomePage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [showElderPicker, setShowElderPicker] = useState(false);
  const [elderOptions, setElderOptions] = useState<UserProfile[]>([]);
  const [isLoadingElders, setIsLoadingElders] = useState(false);

  useEffect(() => {
    const session = getAuthSession();
    if (session && !session.user_role) {
      clearAuthSession();
    }
    setIsLoggedIn(Boolean(session?.user_role));
    setRole(session?.user_role || null);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="inline-block w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-lg text-muted-foreground">正在加载……</p>
      </div>
    );
  }

  const isElder = role === 'elder';
  const isFamily = role === 'family';

  const handleLoginRequired = () => {
    setLoginPrompt(true);
    window.setTimeout(() => setLoginPrompt(false), 2000);
  };

  const handleFamilyUpload = async () => {
    setIsLoadingElders(true);
    try {
      const response = await fetch(`/api/family/relations?family_user_id=${encodeURIComponent(MOCK_USER_PROFILE_FAMILY.user_id)}`);
      const json = await response.json();
      const relations = json.success
        ? (json.data.relations as FamilyRelation[]).filter((relation) => relation.permissions.upload_for_elder)
        : [];
      const elders = relations
        .map((relation) => getMockUserProfile(relation.elder_user_id))
        .filter((profile): profile is UserProfile => Boolean(profile));
      if (elders.length === 1) {
        router.push(`/upload?elder_id=${encodeURIComponent(elders[0].user_id)}`);
        return;
      }
      setElderOptions(elders);
      setShowElderPicker(true);
    } catch {
      setElderOptions([]);
      setShowElderPicker(true);
    } finally {
      setIsLoadingElders(false);
    }
  };

  return (
    <div className="flex flex-col items-center py-8 sm:py-12">
      {loginPrompt && (
        <div className="fixed left-1/2 top-4 z-[100] -translate-x-1/2 rounded-xl bg-red-600 px-7 py-4 text-lg font-bold text-white shadow-xl" role="alert">
          请先登录
        </div>
      )}

      {/* 主标题区域 */}
      <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
          银龄安心
        </h1>
        <p className="text-xl sm:text-2xl text-muted-foreground leading-relaxed max-w-lg mx-auto">
          帮长辈看懂用药信息，识别健康消费风险
        </p>
        {role && (
          <p className="mt-3 text-base text-primary font-semibold">
            当前身份：{USER_ROLE_LABELS[role]}
          </p>
        )}
      </div>

      {/* 主按钮 */}
      {isLoggedIn ? (
        isFamily ? (
        <button
          type="button"
          onClick={handleFamilyUpload}
          disabled={isLoadingElders}
          className="w-full max-w-md bg-primary text-primary-foreground rounded-xl px-8 py-5 text-2xl font-semibold text-center hover:opacity-90 transition-opacity mb-8"
        >
          <span className="mr-2" aria-hidden="true">📷</span>
          {isLoadingElders ? '正在读取绑定信息……' : '代老人上传材料'}
        </button>
        ) : (
        <Link
          href="/upload"
          className="w-full max-w-md bg-primary text-primary-foreground rounded-xl px-8 py-5 text-2xl font-semibold text-center hover:opacity-90 transition-opacity mb-8"
        >
          <span className="mr-2" aria-hidden="true">📷</span>
          拍照或上传材料
        </Link>
        )
      ) : (
        <button
          type="button"
          onClick={handleLoginRequired}
          className="w-full max-w-md bg-primary text-primary-foreground rounded-xl px-8 py-5 text-2xl font-semibold text-center hover:opacity-90 transition-opacity mb-8"
        >
          <span className="mr-2" aria-hidden="true">📷</span>
          拍照或上传材料
        </button>
      )}

      {/* 功能简介（3句话） */}
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl p-6 mb-8">
        <h2 className="text-xl font-bold text-foreground mb-4 text-center">
          三大功能，守护长辈健康
        </h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-3 text-base text-foreground leading-relaxed">
            <span className="text-primary font-bold shrink-0" aria-hidden="true">1.</span>
            拍下药盒、说明书或处方，系统自动识别并生成大字版用药说明。
          </li>
          <li className="flex items-start gap-3 text-base text-foreground leading-relaxed">
            <span className="text-primary font-bold shrink-0" aria-hidden="true">2.</span>
            收到保健品宣传、推销聊天或订单凭证，系统分析风险并提示现在该停止什么操作。
          </li>
          <li className="flex items-start gap-3 text-base text-foreground leading-relaxed">
            <span className="text-primary font-bold shrink-0" aria-hidden="true">3.</span>
            一键生成家属简报，让子女快速了解长辈遇到的情况和需要注意的风险。
          </li>
        </ul>
      </div>

      {/* 次入口：老人 */}
      {isElder && (
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mb-8">
          <Link
            href="/history"
            className="group flex flex-col items-center text-center bg-card border-2 border-border rounded-2xl p-6 hover:border-primary hover:shadow-md transition-all"
          >
            <span className="text-4xl mb-3" role="img" aria-label="历史记录">📋</span>
            <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
              查看历史记录
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              查看和管理之前上传的分析记录。
            </p>
          </Link>

          <Link
            href="/family-bind"
            className="group flex flex-col items-center text-center bg-card border-2 border-border rounded-2xl p-6 hover:border-primary hover:shadow-md transition-all"
          >
            <span className="text-4xl mb-3" role="img" aria-label="邀请家人">👨‍👩‍👧‍👦</span>
            <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
              邀请家人绑定
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              生成绑定码，让子女参与守护。
            </p>
          </Link>

          <Link
            href="/alerts"
            className="group flex flex-col items-center text-center bg-card border-2 border-border rounded-2xl p-6 hover:border-primary hover:shadow-md transition-all"
          >
            <span className="text-4xl mb-3" role="img" aria-label="预警中心">🚨</span>
            <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
              查看预警状态
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              查看红色风险是否已通知家属。
            </p>
          </Link>

          <Link
            href="/account"
            className="group flex flex-col items-center text-center bg-card border-2 border-border rounded-2xl p-6 hover:border-primary hover:shadow-md transition-all"
          >
            <span className="text-4xl mb-3" role="img" aria-label="账户中心">⚙️</span>
            <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
              账户中心
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              管理身份、查看家庭成员和权限。
            </p>
          </Link>
        </div>
      )}

      {/* 次入口：家属 */}
      {isFamily && (
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mb-8">
          <Link
            href="/alerts"
            className="group flex flex-col items-center text-center bg-card border-2 border-border rounded-2xl p-6 hover:border-primary hover:shadow-md transition-all"
          >
            <span className="text-4xl mb-3" role="img" aria-label="红色预警">🚨</span>
            <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
              查看红色预警
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              查看已绑定老人的红色风险提醒。
            </p>
          </Link>

          <Link
            href="/family-bind"
            className="group flex flex-col items-center text-center bg-card border-2 border-border rounded-2xl p-6 hover:border-primary hover:shadow-md transition-all"
          >
            <span className="text-4xl mb-3" role="img" aria-label="家庭绑定">👨‍👩‍👧‍👦</span>
            <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
              家庭绑定
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              输入绑定码，加入老人的家庭守护。
            </p>
          </Link>

          <Link
            href="/history"
            className="group flex flex-col items-center text-center bg-card border-2 border-border rounded-2xl p-6 hover:border-primary hover:shadow-md transition-all"
          >
            <span className="text-4xl mb-3" role="img" aria-label="历史记录">📋</span>
            <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
              查看已授权记录
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              查看老人已授权的历史记录摘要。
            </p>
          </Link>

          <Link
            href="/account"
            className="group flex flex-col items-center text-center bg-card border-2 border-border rounded-2xl p-6 hover:border-primary hover:shadow-md transition-all"
          >
            <span className="text-4xl mb-3" role="img" aria-label="账户中心">⚙️</span>
            <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
              账户中心
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              管理身份、查看家庭成员和权限。
            </p>
          </Link>
        </div>
      )}

      {/* 未登录/未选择身份提示 */}
      {!role && (
        <div className="w-full max-w-2xl bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 mb-8 text-center">
          <p className="text-base text-amber-800 leading-relaxed mb-4">
            您尚未登录或选择身份。登录后可保存记录并使用家庭协同功能。
          </p>
          <Link
            href="/login"
            className="inline-block bg-primary text-primary-foreground rounded-xl px-6 py-3 text-lg font-semibold hover:opacity-90 transition-opacity"
          >
            去登录
          </Link>
        </div>
      )}

      {/* 隐私提醒 */}
      <div className="w-full max-w-2xl bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 mb-6" role="alert">
        <p className="text-base text-amber-800 leading-relaxed">
          <span className="text-xl mr-1" aria-hidden="true">🔒</span>
          <strong>请放心上传必要的材料。</strong>
          上传前，建议遮住身份证号、住址、银行卡号等个人信息。
        </p>
        <Link
          href="/privacy"
          className="inline-block mt-2 text-primary hover:opacity-80 transition-opacity text-base underline underline-offset-4"
        >
          查看隐私说明
        </Link>
      </div>

      {/* 功能边界提醒 */}
      <div className="w-full max-w-2xl bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
        <p className="text-base text-foreground/80 leading-relaxed">
          <strong>本工具帮助您看懂材料和发现需要核实的信息，不能代替医生、药师、警方或监管部门的判断。</strong>
        </p>
      </div>

      {showElderPicker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-5" role="dialog" aria-modal="true" aria-labelledby="elder-picker-title">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 id="elder-picker-title" className="text-xl font-bold text-foreground mb-2">选择本次代上传的老人</h2>
            <p className="text-base text-muted-foreground mb-4">请选择材料所属的老人，避免记录放错账户。</p>
            {elderOptions.length > 0 ? (
              <div className="space-y-3">
                {elderOptions.map((elder) => (
                  <button
                    key={elder.user_id}
                    type="button"
                    onClick={() => router.push(`/upload?elder_id=${encodeURIComponent(elder.user_id)}`)}
                    className="w-full rounded-xl border-2 border-border bg-white px-5 py-4 text-left text-lg font-semibold text-foreground hover:border-primary"
                  >
                    {elder.display_name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-xl bg-amber-50 p-4 text-base text-amber-800">
                暂无允许代上传的老人，请先完成家庭绑定或修改权限。
              </p>
            )}
            <button
              type="button"
              onClick={() => setShowElderPicker(false)}
              className="mt-4 w-full rounded-xl bg-muted px-5 py-3 text-base font-semibold text-foreground"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
