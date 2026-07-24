'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { RiskBadge } from '@/components/shared/risk-badge';
import { MOCK_USER_PROFILE_ELDER, MOCK_USER_PROFILE_FAMILY, MOCK_ALERT_EVENT, MOCK_NOTIFICATION_RECORD, MOCK_ALERT_EVENTS_BY_ELDER, MOCK_NOTIFICATION_RECORDS_BY_ELDER, getMockUserProfile } from '@/lib/mock-data';
import type { FamilyRelation, NotificationStatus, UserProfile, UserRole } from '@/lib/types';
import { getAuthSession } from '@/lib/auth-session';

function getCurrentRole(): UserRole {
  if (typeof window === 'undefined') return 'elder';
  return (localStorage.getItem('user_role') as UserRole) || 'elder';
}

const STATUS_LABELS: Record<NotificationStatus, string> = {
  pending: '等待发送',
  sent: '待确认查看',
  failed: '发送失败',
  read: '已读',
  acknowledged: '已确认',
};

export default function AlertsPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>('elder');
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus>(MOCK_NOTIFICATION_RECORD.status);
  const [authChecked, setAuthChecked] = useState(false);
  const [selectedElderId, setSelectedElderId] = useState(MOCK_USER_PROFILE_ELDER.user_id);
  const [elderOptions, setElderOptions] = useState<UserProfile[]>([MOCK_USER_PROFILE_ELDER]);

  useEffect(() => {
    const session = getAuthSession();
    if (!session?.user_role) {
      router.replace('/login');
      return;
    }
    const currentRole = getCurrentRole();
    setRole(currentRole);
    setAuthChecked(true);
    if (currentRole === 'family') {
      fetch(`/api/family/relations?family_user_id=${encodeURIComponent(MOCK_USER_PROFILE_FAMILY.user_id)}`)
        .then((response) => response.json())
        .then((json) => {
          if (!json.success) return;
          const elders = (json.data.relations as FamilyRelation[])
            .filter((relation) => relation.permissions.receive_red_alert)
            .map((relation) => getMockUserProfile(relation.elder_user_id))
            .filter((profile): profile is UserProfile => Boolean(profile));
          setElderOptions(elders);
          const pendingElder = elders.find((elder) => {
            const notification = MOCK_NOTIFICATION_RECORDS_BY_ELDER[elder.user_id];
            return notification && notification.status !== 'acknowledged';
          });
          if (pendingElder) {
            setSelectedElderId(pendingElder.user_id);
            return;
          }
          if (elders.length > 0) setSelectedElderId(elders[0].user_id);
        });
    }
  }, [router]);

  const isElder = role === 'elder';
  const selectedElder = getMockUserProfile(selectedElderId) || MOCK_USER_PROFILE_ELDER;
  const alertEvent = MOCK_ALERT_EVENTS_BY_ELDER[selectedElderId] || MOCK_ALERT_EVENT;
  const notificationRecord = MOCK_NOTIFICATION_RECORDS_BY_ELDER[selectedElderId] || MOCK_NOTIFICATION_RECORD;

  useEffect(() => {
    setNotificationStatus(
      (localStorage.getItem(`yinling_notification_status:${notificationRecord.notification_id}`) as NotificationStatus)
      || notificationRecord.status
    );
  }, [notificationRecord.notification_id, notificationRecord.status]);

  const alertStatusText: Record<typeof alertEvent.status, string> = {
    created: '预警已创建',
    no_recipient: '尚未通知家属',
    notifying: '正在通知家属',
    notified: '已提醒家属',
    partially_failed: '部分通知失败',
    closed: '已关闭',
  };

  const handleAcknowledge = () => {
    setNotificationStatus('acknowledged');
    localStorage.setItem(`yinling_notification_status:${notificationRecord.notification_id}`, 'acknowledged');
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
        title="预警中心"
        subtitle={isElder ? '查看红色风险是否已通知家属' : '查看已绑定老人的红色预警'}
        backHref="/"
      />

      {!isElder && (
        <div className="bg-card border-2 border-border rounded-2xl p-5 mb-6">
          <label htmlFor="alert-elder" className="block text-lg font-bold text-foreground mb-2">查看哪位老人的预警</label>
          <select
            id="alert-elder"
            value={selectedElderId}
            onChange={(event) => setSelectedElderId(event.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {elderOptions.map((elder) => (
              <option key={elder.user_id} value={elder.user_id}>{elder.display_name}</option>
            ))}
          </select>
        </div>
      )}

      {isElder ? (
        <>
          {/* 老人端：预警处理状态 */}
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <h3 className="text-xl font-bold text-foreground mb-4">预警处理状态</h3>
            <div className="border border-border rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-base text-muted-foreground">预警编号</span>
                <span className="text-base text-foreground font-semibold">{alertEvent.alert_id}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-base text-muted-foreground">风险等级</span>
                <RiskBadge level={alertEvent.risk_level} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-base text-muted-foreground">当前状态</span>
                <span className="text-base text-foreground font-semibold">{alertStatusText[alertEvent.status]}</span>
              </div>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed">
              {alertEvent.status === 'notified' && '已提醒家属，等待查看。'}
              {alertEvent.status === 'no_recipient' && '尚未通知家属，请立即电话联系可信家人或前往家庭绑定。'}
            </p>
          </div>

          {/* 立即行动 */}
          <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 mb-6">
            <h3 className="text-xl font-bold text-red-700 mb-4">现在该做什么</h3>
            <ul className="space-y-2">
              {alertEvent.stop_actions.map((action, i) => (
                <li key={i} className="text-base text-red-700 font-semibold leading-relaxed">
                  • {action}
                </li>
              ))}
            </ul>
          </div>

          {/* 家属查看状态 */}
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <h3 className="text-xl font-bold text-foreground mb-4">家属查看状态</h3>
            <div className="border border-border rounded-xl p-4">
              <p className="text-base text-foreground">
                <strong>{MOCK_USER_PROFILE_FAMILY.display_name}</strong>（家属）
              </p>
              <p className="text-base text-muted-foreground mt-1">
                状态：{STATUS_LABELS[notificationStatus]}
              </p>
              {notificationStatus === 'acknowledged' && (
                <p className="text-base text-green-700 mt-1 font-semibold">
                  家属已确认知晓
                </p>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* 家属端：预警列表 */}
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <h3 className="text-xl font-bold text-foreground mb-4">来自 {selectedElder.display_name} 的预警</h3>
            <div className="border border-border rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-base text-muted-foreground">发生时间</span>
                <span className="text-base text-foreground">{alertEvent.created_at}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-base text-muted-foreground">风险等级</span>
                <RiskBadge level={alertEvent.risk_level} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-base text-muted-foreground">状态</span>
                <span className="text-base text-foreground font-semibold">{STATUS_LABELS[notificationStatus]}</span>
              </div>
            </div>

            <h4 className="font-semibold text-foreground mb-2">关键证据</h4>
            <ul className="space-y-2 mb-4">
              {alertEvent.evidence.map((item, i) => (
                <li key={i} className="text-base text-foreground leading-relaxed">
                  • “{item.quote}” <span className="text-muted-foreground">（{item.source}）</span>
                </li>
              ))}
            </ul>

            <h4 className="font-semibold text-foreground mb-2">立即行动</h4>
            <ul className="space-y-2 mb-4">
              {alertEvent.stop_actions.map((action, i) => (
                <li key={i} className="text-base text-red-700 font-semibold leading-relaxed">
                  • {action}
                </li>
              ))}
            </ul>

            {notificationStatus !== 'acknowledged' && (
              <button
                onClick={handleAcknowledge}
                className="w-full bg-primary text-primary-foreground rounded-xl px-6 py-3 text-lg font-semibold hover:opacity-90 transition-opacity"
              >
                我已查看
              </button>
            )}
            {notificationStatus === 'acknowledged' && (
              <p className="rounded-xl bg-green-50 p-3 text-center text-base font-semibold text-green-700" role="status">
                已确认查看
              </p>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <h3 className="text-xl font-bold text-foreground mb-4">查看家属简报</h3>
            <p className="text-base text-muted-foreground mb-4">
              预警已生成家属简报，您可查看完整情况和建议行动。
            </p>
            <Link
              href={`/family?source=alert&elder_id=${encodeURIComponent(selectedElderId)}&alert_id=${encodeURIComponent(alertEvent.alert_id)}`}
              className="inline-block bg-primary text-primary-foreground rounded-xl px-6 py-3 text-lg font-semibold hover:opacity-90 transition-opacity"
            >
              查看简报
            </Link>
          </div>
        </>
      )}
      <Link
        href="/"
        className="mt-6 block w-full bg-muted text-foreground rounded-xl px-8 py-4 text-xl font-semibold text-center hover:opacity-90 transition-opacity"
      >
        返回首页
      </Link>
    </div>
  );
}
