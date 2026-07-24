'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { RiskBadge } from '@/components/shared/risk-badge';
import { MOCK_HISTORY, MOCK_USER_PROFILE_ELDER, MOCK_USER_PROFILE_FAMILY, getMockUserProfile } from '@/lib/mock-data';
import { MATERIAL_TYPE_LABELS } from '@/lib/types';
import type { FamilyRelation, HistoryRecord, MaterialType, RiskLevel, UserProfile, UserRole } from '@/lib/types';
import { useState, useMemo, useEffect } from 'react';
import { getAuthSession, type AuthSessionUser } from '@/lib/auth-session';
import { printMarkdownAsPdf } from '@/lib/print-markdown';
import { buildExportFilename, getExportSourceLabel } from '@/lib/export-filename';

const MATERIAL_FILTER_OPTIONS: { value: MaterialType | 'all'; label: string }[] = [
  { value: 'all', label: '全部类型' },
  { value: 'regular_medicine', label: '正规药品' },
  { value: 'medicine_leaflet', label: '药品说明书' },
  { value: 'hospital_prescription', label: '医院处方' },
  { value: 'health_supplement', label: '保健食品' },
  { value: 'health_promotion', label: '健康宣传材料' },
  { value: 'sales_chat', label: '推销聊天记录' },
  { value: 'payment_proof', label: '订单或付款凭证' },
];

const RISK_FILTER_OPTIONS: { value: RiskLevel | 'all' | 'null'; label: string }[] = [
  { value: 'all', label: '全部风险' },
  { value: 'red', label: '高风险' },
  { value: 'yellow', label: '需核验' },
  { value: 'green', label: '暂未发现风险' },
  { value: 'null', label: '无风险标签' },
];

function exportHistoryRecordsAsPdf(records: HistoryRecord[], account: AuthSessionUser | null) {
  const accountId = account?.user_id || '未获取';
  const accountName = account?.username || '未获取';
  const fullPhone = account?.phone_full || account?.phone || '未获取';
  const exportedAt = new Date().toLocaleString('zh-CN', { hour12: false });
  const pages = records.map((record) => [
    `# 银龄安心·${record.summary}`,
    '',
    `- 导出时间：${exportedAt}`,
    `- 来源：${getExportSourceLabel(account)}`,
    `- 账户ID：${accountId}`,
    `- 账户名称：${accountName}`,
    `- 手机号全文：${fullPhone}`,
    '',
    '## 记录概览',
    '',
    `- 材料类型：${MATERIAL_TYPE_LABELS[record.material_type]}`,
    `- 分析时间：${record.analyzed_at}`,
    `- 风险等级：${record.risk_level === 'red' ? '高风险' : record.risk_level === 'yellow' ? '需核验' : record.risk_level === 'green' ? '暂未发现风险' : '无风险标签'}`,
    `- 记录状态：${record.status === 'confirmed' ? '已确认' : record.status === 'analyzing' ? '分析中' : '待确认'}`,
    '',
    ...(record.detail_sections?.flatMap((section) => [
      `## ${section.title}`,
      '',
      ...section.items.map((item) => `- ${item}`),
      '',
    ]) || ['## 详细信息', '', '- 当前记录未保存详细分析内容。', '']),
    '> 本记录用于辅助回顾材料分析结果，涉及用药请以医生或药师意见为准。',
  ].join('\n'));
  printMarkdownAsPdf(
    pages,
    buildExportFilename(account, records.length > 1 ? '历史记录合集' : '历史记录')
  );
}

function recordStatusLabel(status: HistoryRecord['status']): string {
  if (status === 'confirmed') return '已确认';
  if (status === 'analyzing') return '分析中';
  return '待确认';
}

function recordStatusClass(status: HistoryRecord['status']): string {
  if (status === 'confirmed') return 'bg-green-100 text-green-800';
  if (status === 'analyzing') return 'bg-blue-100 text-blue-800';
  return 'bg-amber-100 text-amber-800';
}

export default function HistoryPage() {
  const router = useRouter();
  const [records, setRecords] = useState<HistoryRecord[]>(MOCK_HISTORY);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [keyword, setKeyword] = useState('');
  const [materialFilter, setMaterialFilter] = useState<MaterialType | 'all'>('all');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all' | 'null'>('all');
  const [authChecked, setAuthChecked] = useState(false);
  const [retentionDays, setRetentionDays] = useState('30');
  const [retentionKey, setRetentionKey] = useState('');
  const [recentlyDeleted, setRecentlyDeleted] = useState<HistoryRecord[]>([]);
  const [role, setRole] = useState<UserRole>('elder');
  const [selectedElderId, setSelectedElderId] = useState(MOCK_USER_PROFILE_ELDER.user_id);
  const [elderOptions, setElderOptions] = useState<UserProfile[]>([MOCK_USER_PROFILE_ELDER]);
  const [authUser, setAuthUser] = useState<AuthSessionUser | null>(null);

  useEffect(() => {
    const session = getAuthSession();
    if (!session?.user_role) {
      router.replace('/login');
      return;
    }
    const key = `yinling_retention_days:${session.user_id}`;
    setAuthUser(session);
    setRole(session.user_role);
    setRetentionKey(key);
    setRetentionDays(localStorage.getItem(key) || '30');
    setAuthChecked(true);
    fetch('/api/medicine/records')
      .then((response) => response.json())
      .then((json) => {
        if (!json.success) return;
        const savedRecords = json.data.history_records as HistoryRecord[];
        const savedIds = new Set(savedRecords.map((record) => record.id));
        setRecords((current) => [...savedRecords, ...current.filter((record) => !savedIds.has(record.id))]);
      });
    if (session.user_role === 'family') {
      fetch(`/api/family/relations?family_user_id=${encodeURIComponent(MOCK_USER_PROFILE_FAMILY.user_id)}`)
        .then((response) => response.json())
        .then((json) => {
          if (!json.success) return;
          const elders = (json.data.relations as FamilyRelation[])
            .filter((relation) => relation.permissions.view_history_summary)
            .map((relation) => getMockUserProfile(relation.elder_user_id))
            .filter((profile): profile is UserProfile => Boolean(profile));
          setElderOptions(elders);
          if (elders.length > 0) setSelectedElderId(elders[0].user_id);
        });
    }
  }, [router]);

  useEffect(() => {
    if (recentlyDeleted.length === 0) return;
    const timer = window.setTimeout(() => setRecentlyDeleted([]), 5000);
    return () => window.clearTimeout(timer);
  }, [recentlyDeleted]);

  const subjectRecords = useMemo(
    () => role === 'family'
      ? records.filter((record) => record.subject_user_id === selectedElderId)
      : records.filter((record) =>
          record.subject_user_id === MOCK_USER_PROFILE_ELDER.user_id
          || record.subject_user_id === authUser?.user_id
        ),
    [records, role, selectedElderId, authUser]
  );

  const filteredRecords = useMemo(() => {
    return subjectRecords.filter((record) => {
      if (keyword && !record.summary.includes(keyword) && !MATERIAL_TYPE_LABELS[record.material_type].includes(keyword)) {
        return false;
      }
      if (materialFilter !== 'all' && record.material_type !== materialFilter) {
        return false;
      }
      if (riskFilter !== 'all') {
        if (riskFilter === 'null' && record.risk_level !== null) return false;
        if (riskFilter !== 'null' && record.risk_level !== riskFilter) return false;
      }
      return true;
    });
  }, [subjectRecords, keyword, materialFilter, riskFilter]);

  const pendingCount = subjectRecords.filter((r) => r.status === 'pending').length;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRecords.length && filteredRecords.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecords.map((r) => r.id)));
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('确定删除这条记录吗？\n删除后仅可在5秒内撤销。')) {
      setRecentlyDeleted(records.filter((record) => record.id === id));
      setRecords((prev) => prev.filter((r) => r.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleBatchDelete = () => {
    if (confirm(`确定删除选中的 ${selectedIds.size} 条记录吗？\n删除后仅可在5秒内撤销。`)) {
      setRecentlyDeleted(records.filter((record) => selectedIds.has(record.id)));
      setRecords((prev) => prev.filter((r) => !selectedIds.has(r.id)));
      setSelectedIds(new Set());
    }
  };

  const handleExport = (record: HistoryRecord) => {
    exportHistoryRecordsAsPdf([record], authUser);
  };

  const handleBatchExport = () => {
    exportHistoryRecordsAsPdf(records.filter((record) => selectedIds.has(record.id)), authUser);
  };

  const handleConfirmRecord = (id: string) => {
    if (!confirm('请确认您已经核对这条记录的材料和分析结果。确认后将标记为“已确认”。')) return;
    setRecords((current) => current.map((record) =>
      record.id === id ? { ...record, status: 'confirmed' } : record
    ));
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
        title="历史记录"
        backHref="/"
      />

      {role === 'family' && (
        <div className="bg-card border-2 border-border rounded-2xl p-5 mb-4">
          <label htmlFor="history-elder" className="block text-lg font-bold text-foreground mb-2">查看哪位老人的已授权记录</label>
          <select
            id="history-elder"
            value={selectedElderId}
            onChange={(event) => {
              setSelectedElderId(event.target.value);
              setSelectedIds(new Set());
            }}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {elderOptions.map((elder) => (
              <option key={elder.user_id} value={elder.user_id}>{elder.display_name}</option>
            ))}
          </select>
        </div>
      )}

      {recentlyDeleted.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4 flex items-center justify-between gap-3" role="status">
          <p className="text-base text-green-800">已删除 {recentlyDeleted.length} 条记录，5秒内可以撤销。</p>
          <button
            type="button"
            onClick={() => {
              setRecords((prev) => [...recentlyDeleted, ...prev]);
              setRecentlyDeleted([]);
            }}
            className="shrink-0 rounded-xl bg-green-700 px-4 py-2 text-base font-semibold text-white"
          >
            撤销
          </button>
        </div>
      )}

      {/* 保存说明 */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 mb-4" role="alert">
        <p className="text-base text-amber-800 leading-relaxed">
          <span aria-hidden="true">💾</span> 保存后，您可以在历史记录中再次查看本次结果。离开后可能无法再次查看本次结果。
        </p>
      </div>

      {/* 顶部统计 */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-4">
        <p className="text-lg text-foreground">
          共 <span className="font-bold text-primary">{subjectRecords.length}</span> 条记录
          {pendingCount > 0 && (
            <>, <span className="font-bold text-amber-600">{pendingCount}</span> 条待确认</>
          )}
        </p>
      </div>

      {subjectRecords.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center">
          <span className="text-5xl block mb-4" aria-hidden="true">📭</span>
          <p className="text-xl text-muted-foreground">暂无历史记录</p>
          <p className="text-base text-muted-foreground mt-2">上传材料开始分析</p>
          <Link
            href="/upload"
            className="inline-block mt-4 bg-primary text-primary-foreground rounded-xl px-6 py-3 text-lg font-semibold hover:opacity-90 transition-opacity"
          >
            上传材料开始分析
          </Link>
        </div>
      ) : (
        <>
          {/* 筛选栏 */}
          <div className="bg-card border border-border rounded-2xl p-5 mb-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="搜索关键词..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <select
                value={materialFilter}
                onChange={(e) => setMaterialFilter(e.target.value as MaterialType | 'all')}
                className="rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {MATERIAL_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value as RiskLevel | 'all' | 'null')}
                className="rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {RISK_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="select-all"
                checked={filteredRecords.length > 0 && selectedIds.size === filteredRecords.length}
                onChange={toggleSelectAll}
                className="w-5 h-5 accent-primary"
              />
              <label htmlFor="select-all" className="text-base text-foreground">
                全选当前筛选结果
              </label>
              {selectedIds.size > 0 && (
                <span className="text-base text-muted-foreground">
                  （已选 {selectedIds.size} 条）
                </span>
              )}
            </div>
          </div>

          {/* 批量操作 */}
          {selectedIds.size > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-4 flex flex-wrap gap-3">
              <button
                onClick={handleBatchExport}
                className="bg-primary text-primary-foreground rounded-xl px-5 py-2 text-base font-semibold hover:opacity-90 transition-opacity"
              >
                批量导出
              </button>
              <button
                onClick={handleBatchDelete}
                className="bg-red-500 text-white rounded-xl px-5 py-2 text-base font-semibold hover:bg-red-600 transition-colors"
              >
                批量删除
              </button>
            </div>
          )}

          {/* 记录列表 */}
          <div className="space-y-4 mb-6">
            {filteredRecords.map((record) => (
              <div key={record.id} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(record.id)}
                    onChange={() => toggleSelect(record.id)}
                    className="w-5 h-5 accent-primary shrink-0 mt-1"
                  />
                  <div className="w-20 h-20 rounded-xl overflow-hidden border border-border bg-muted shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={record.thumbnail}
                      alt="材料缩略图"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-foreground mb-1">{record.summary}</p>
                    <div className="flex flex-wrap items-center gap-3 text-base text-muted-foreground">
                      <span>{MATERIAL_TYPE_LABELS[record.material_type]}</span>
                      <span>·</span>
                      <span>{record.analyzed_at}</span>
                      <span className={`${recordStatusClass(record.status)} text-sm font-semibold px-2 py-0.5 rounded`}>
                        {recordStatusLabel(record.status)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {record.risk_level && <RiskBadge level={record.risk_level} size="sm" />}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-4 pl-0 sm:pl-8">
                  <Link
                    href={record.material_type.includes('medicine') ? '/medicine' : '/fraud'}
                    className="bg-primary text-primary-foreground rounded-xl px-5 py-2 text-base font-semibold hover:opacity-90 transition-opacity"
                  >
                    查看详情
                  </Link>
                  <button
                    onClick={() => handleExport(record)}
                    className="bg-secondary text-secondary-foreground rounded-xl px-5 py-2 text-base font-semibold hover:opacity-90 transition-opacity"
                  >
                    导出
                  </button>
                  {record.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => handleConfirmRecord(record.id)}
                      className="bg-amber-500 text-white rounded-xl px-5 py-2 text-base font-semibold hover:bg-amber-600 transition-colors"
                    >
                      确认记录
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="bg-muted text-foreground rounded-xl px-5 py-2 text-base font-semibold hover:opacity-90 transition-opacity"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 隐私设置入口 */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-xl font-bold text-foreground mb-4">🔒 隐私设置</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-base text-foreground mb-2">自动过期时间</label>
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
              <button
                onClick={() => {
                  if (confirm('确定清除所有历史记录吗？\n删除后仅可在5秒内撤销。')) {
                    setRecentlyDeleted(subjectRecords);
                    setRecords((current) => role === 'family'
                      ? current.filter((record) => record.subject_user_id !== selectedElderId)
                      : []
                    );
                    setSelectedIds(new Set());
                  }
                }}
                className="w-full bg-red-50 text-red-700 border border-red-200 rounded-xl px-5 py-3 text-base font-semibold hover:bg-red-100 transition-colors"
              >
                一键清除所有记录
              </button>
            </div>
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
