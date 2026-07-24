'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { RiskBadge } from '@/components/shared/risk-badge';
import { getAuthSession, type AuthSessionUser } from '@/lib/auth-session';
import { downloadTextImage } from '@/lib/download-text-image';
import { buildExportFilename, getExportSourceLabel } from '@/lib/export-filename';
import { buildFamilyBriefFromAlert, buildFamilyBriefFromAnalysis } from '@/lib/family-brief';
import { MOCK_ALERT_EVENTS_BY_ELDER, getMockUserProfile } from '@/lib/mock-data';
import { loadCurrentMaterial } from '@/lib/session-material';
import { MATERIAL_TYPE_LABELS } from '@/lib/types';
import type { FamilyBrief, Medicine, Risk } from '@/lib/types';

export default function FamilyPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [brief, setBrief] = useState<FamilyBrief | null>(null);
  const [account, setAccount] = useState<AuthSessionUser | null>(null);
  const [briefSource, setBriefSource] = useState<'analysis' | 'alert'>('analysis');
  const isAutoPush = brief?.highest_risk === 'red';
  const isAlertBrief = briefSource === 'alert';

  useEffect(() => {
    const session = getAuthSession();
    if (!session?.user_role) {
      router.replace('/login');
      return;
    }
    setAccount(session);
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('source') === 'alert') {
      const elderId = searchParams.get('elder_id') || '';
      const alertId = searchParams.get('alert_id') || '';
      const alertEvent = MOCK_ALERT_EVENTS_BY_ELDER[elderId];
      if (alertEvent && (!alertId || alertEvent.alert_id === alertId)) {
        const elderName = getMockUserProfile(elderId)?.display_name || '老人';
        setBrief(buildFamilyBriefFromAlert(alertEvent, elderName));
        setBriefSource('alert');
      }
      setAuthChecked(true);
      return;
    }
    const material = loadCurrentMaterial();
    if (material) {
      let medicine: Medicine | null = null;
      let risk: Risk | null = null;
      try {
        const savedMedicine = sessionStorage.getItem(`yinling_saved_medicine:${material.material_id}`);
        if (savedMedicine) medicine = JSON.parse(savedMedicine) as Medicine;
      } catch {
        medicine = null;
      }
      try {
        const savedRisk = sessionStorage.getItem(`yinling_saved_risk:${material.material_id}`);
        if (savedRisk) risk = JSON.parse(savedRisk) as Risk;
      } catch {
        risk = null;
      }
      setBrief(buildFamilyBriefFromAnalysis(material, medicine, risk));
    }
    setAuthChecked(true);
  }, [router]);

  const handleCopy = (content?: string) => {
    if (!brief) return;
    const text = content || [
      `【家属简报】`,
      ``,
      `老人上传了什么材料：${brief.material_summary}`,
      `材料类型：${brief.material_type}`,
      `涉及的产品或人员：${brief.product_or_person}`,
      `销售人员/机构：${brief.salesperson_or_org}`,
      `上传时间：${brief.upload_time}`,
      `是否已经付款：${brief.payment_status === 'paid' ? '是' : brief.payment_status === 'not_paid' ? '否' : '暂未确认'}`,
      `付款金额：${brief.payment_amount}`,
      `付款账户：${brief.payment_account}`,
      `是否被要求停药：${brief.stop_medicine_request ? '是' : '否'}`,
      `是否提供了敏感信息：${brief.personal_data_exposed.length > 0 ? brief.personal_data_exposed.join('、') : '否'}`,
      `当前最高风险等级：${brief.highest_risk === 'red' ? '高风险' : brief.highest_risk === 'yellow' ? '需核验' : '暂未发现风险'}`,
      ``,
      `关键证据：`,
      ...brief.key_evidence.map((e, i) => `${i + 1}. ${e}`),
      ``,
      `家属下一步建议：`,
      ...brief.next_actions.map((a, i) => `${i + 1}. ${a}`),
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      alert('已复制到剪贴板，可转发给家人');
    }).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('已复制到剪贴板，可转发给家人');
    });
  };

  const handleShare = async () => {
    if (!brief) return;
    try {
      const response = await fetch('/api/family/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        alert(json.error_message || '分享链接生成失败，请稍后重试。');
        return;
      }
      handleCopy(json.data.share_url as string);
    } catch {
      alert('分享链接生成失败，请检查网络后重试。');
    }
  };

  const handlePrint = () => {
    if (!brief) return;
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      alert('浏览器阻止了打印窗口，请允许弹出窗口后重试。');
      return;
    }
    printWindow.opener = null;
    const escapeHtml = (value: string) => value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
    const generatedAt = brief.upload_time || new Date().toLocaleString('zh-CN', { hour12: false });
    const printedAt = new Date().toLocaleString('zh-CN', { hour12: false });
    const filename = buildExportFilename(account, '家属简报');
    const evidence = brief.key_evidence.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    const actions = brief.next_actions.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    const riskLabel = brief.highest_risk === 'red'
      ? '高风险'
      : brief.highest_risk === 'yellow'
        ? '需要核验'
        : '暂未发现明显风险';

    printWindow.document.write(`
      <!doctype html>
      <html lang="zh-CN">
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(filename)}</title>
          <style>
            @page { size: A4; margin: 18mm; }
            body { color: #111; font-family: "Microsoft YaHei", "Noto Sans SC", sans-serif; font-size: 14pt; line-height: 1.75; }
            h1 { margin: 0 0 8mm; text-align: center; font-size: 26pt; }
            h2 { margin: 7mm 0 2mm; border-bottom: 1px solid #777; font-size: 17pt; }
            p { margin: 1.5mm 0; }
            ol { margin: 2mm 0; padding-left: 8mm; }
            .meta { text-align: center; color: #444; font-size: 11pt; }
            .notice { margin-top: 8mm; border-top: 1px solid #777; padding-top: 3mm; font-size: 11pt; }
          </style>
        </head>
        <body>
          <h1>银龄安心·家属简报</h1>
          <p class="meta">简报生成时间：${escapeHtml(generatedAt)}</p>
          <p class="meta">打印日期：${escapeHtml(printedAt)}</p>
          <p class="meta">来源：${escapeHtml(getExportSourceLabel(account))}</p>
          <p class="meta">账户ID：${escapeHtml(account?.user_id || '未获取')}　账户名称：${escapeHtml(account?.username || '未获取')}　手机号：${escapeHtml(account?.phone_full || account?.phone || '未获取')}</p>
          <h2>情况摘要</h2>
          <p>材料：${escapeHtml(brief.material_summary)}</p>
          <p>材料类型：${escapeHtml(brief.material_type ? MATERIAL_TYPE_LABELS[brief.material_type] : '暂未确认')}</p>
          <p>涉及产品或人员：${escapeHtml(brief.product_or_person || '暂未确认')}</p>
          <p>销售人员或机构：${escapeHtml(brief.salesperson_or_org || '暂未确认')}</p>
          <p>当前风险：${riskLabel}</p>
          <p>付款状态：${brief.payment_status === 'paid' ? '已付款' : brief.payment_status === 'not_paid' ? '未付款' : '暂未确认'}</p>
          <p>付款金额：${escapeHtml(brief.payment_amount || '暂未确认')}</p>
          <p>付款账户：${escapeHtml(brief.payment_account || '暂未确认')}</p>
          <p>是否被要求停药：${brief.stop_medicine_request ? '是' : '否'}</p>
          <p>可能涉及的敏感信息：${escapeHtml(brief.personal_data_exposed.length > 0 ? brief.personal_data_exposed.join('、') : '未发现')}</p>
          <h2>关键证据</h2>
          <ol>${evidence}</ol>
          <h2>建议家人先做</h2>
          <ol>${actions}</ol>
          <p class="notice">本简报用于帮助家人沟通和核实，不替代医生、药师或有关部门的专业意见。</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleExportImage = () => {
    if (!brief) return;
    downloadTextImage('银龄安心·家属简报', [
      {
        title: '账户信息',
        lines: [
          `账户ID：${account?.user_id || '未获取'}`,
          `账户名称：${account?.username || '未获取'}`,
          `手机号全文：${account?.phone_full || account?.phone || '未获取'}`,
          `来源：${getExportSourceLabel(account)}`,
        ],
      },
      {
        title: '老人上传了什么',
        lines: [
          `材料：${brief.material_summary}`,
          `材料类型：${brief.material_type ? MATERIAL_TYPE_LABELS[brief.material_type] : '暂未确认'}`,
          `涉及产品或人员：${brief.product_or_person || '暂未确认'}`,
          `销售人员/机构：${brief.salesperson_or_org || '暂未确认'}`,
        ],
      },
      {
        title: '财务与信息安全',
        lines: [
          `是否付款：${brief.payment_status === 'paid' ? '是' : brief.payment_status === 'not_paid' ? '否' : '暂未确认'}`,
          `付款金额：${brief.payment_amount || '暂未确认'}`,
          `付款账户：${brief.payment_account || '暂未确认'}`,
          `是否被要求停药：${brief.stop_medicine_request ? '是' : '否'}`,
          `可能涉及的敏感信息：${brief.personal_data_exposed.length > 0 ? brief.personal_data_exposed.join('、') : '未发现'}`,
        ],
      },
      { title: '关键证据', lines: brief.key_evidence.map((item, index) => `${index + 1}. ${item}`) },
      { title: '建议家人先做', lines: brief.next_actions.map((item, index) => `${index + 1}. ${item}`) },
    ], buildExportFilename(account, '家属简报', 'png'));
  };

  if (!authChecked) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-lg text-muted-foreground">正在检查登录状态……</p>
      </div>
    );
  }

  if (!brief) {
    return (
      <div>
        <PageHeader title="给家人的情况说明" backHref="/" />
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 text-center">
          <p className="text-lg text-amber-900">当前没有可生成简报的分析内容，请从药品解读或防骗分析结果页点击“生成家属简报”。</p>
        </div>
        <Link
          href="/"
          className="mt-4 block w-full bg-muted text-foreground rounded-xl px-8 py-4 text-xl font-semibold text-center hover:opacity-90 transition-opacity"
        >
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="给家人的情况说明"
        subtitle={isAlertBrief ? '根据预警中心当前预警生成' : '以下信息供老人的子女或照护者查看'}
        backHref="/"
      />

      {/* 自动推送/手动转发提示 */}
      <div className={`border rounded-2xl p-5 mb-6 ${
        isAutoPush ? 'bg-red-50 border-red-300' : 'bg-primary/5 border-primary/20'
      }`}>
        <p className="text-base leading-relaxed">
          {isAutoPush ? (
            <>
              <span aria-hidden="true">🚨</span>{' '}
              检测到红色风险，简报已自动生成。如已授权家属联系方式，系统将自动推送；未授权时请手动转发给家人。
            </>
          ) : (
            <>
              <span aria-hidden="true">ℹ️</span>{' '}
              简报不会自动发送给家属，请转发后主动提醒家人查看。
            </>
          )}
        </p>
      </div>

      {/* 模块1：老人上传了什么 */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-4">
        <h3 className="text-xl font-bold text-foreground mb-5">{isAlertBrief ? '预警内容概要' : '老人上传了什么'}</h3>
        <div className="space-y-4">
          <InfoRow label={isAlertBrief ? '简报来源' : '材料类型'} value={isAlertBrief ? '预警中心' : brief.material_type ? MATERIAL_TYPE_LABELS[brief.material_type] : ''} />
          <InfoRow label={isAlertBrief ? '预警涉及内容' : '涉及产品'} value={brief.product_or_person} />
          <InfoRow label="销售人员/机构" value={brief.salesperson_or_org ?? ''} />
          <InfoRow label={isAlertBrief ? '预警时间' : '上传时间'} value={brief.upload_time ?? ''} />
        </div>
        {brief.material_image && (
          <div className="mt-4 rounded-xl overflow-hidden border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={brief.material_image}
              alt="上传材料缩略图"
              className="w-full max-h-48 object-contain bg-muted"
            />
          </div>
        )}
      </div>

      {/* 模块2：财务与信息安全 */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-4">
        <h3 className="text-xl font-bold text-foreground mb-5">财务与信息安全</h3>
        <div className="space-y-4">
          <InfoRow
            label="是否已经付款"
            value={brief.payment_status === 'paid' ? '是' : brief.payment_status === 'not_paid' ? '否' : '暂未确认'}
          />
          <InfoRow label="付款金额" value={brief.payment_amount} />
          <InfoRow label="付款账户" value={brief.payment_account ?? ''} />
          <InfoRow
            label="是否被要求停药"
            value={brief.stop_medicine_request ? '是 ⚠️' : '否'}
            highlight={brief.stop_medicine_request}
          />
          <InfoRow
            label="是否泄露身份证/银行卡/验证码"
            value={brief.personal_data_exposed.length > 0 ? brief.personal_data_exposed.join('、') : '否'}
            highlight={brief.personal_data_exposed.length > 0}
          />
        </div>
      </div>

      {/* 模块3：风险摘要 */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-4">
        <h3 className="text-lg font-semibold text-foreground mb-3">目前最需要关注</h3>
        <RiskBadge level={brief.highest_risk} size="lg" />
        {(brief.risk_categories?.length ?? 0) > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold text-foreground mb-2">材料中出现了</h4>
            <p className="text-base text-foreground leading-relaxed">
              {brief.material_summary}
            </p>
          </div>
        )}
      </div>

      {/* 关键证据 */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-4">
        <h3 className="text-lg font-semibold text-foreground mb-3">原文写着</h3>
        <ul className="space-y-2">
          {brief.key_evidence.map((evidence, i) => (
            <li key={i} className="text-base text-foreground leading-relaxed">
              <span aria-hidden="true">“</span>{evidence}<span aria-hidden="true">”</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 模块4：建议家属行动 */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-6 mb-4">
        <h3 className="text-xl font-bold text-primary mb-4">建议家人先做</h3>
        <ol className="space-y-2">
          {brief.next_actions.map((action, i) => (
            <li key={i} className="flex items-start gap-2 text-base text-foreground leading-relaxed">
              <span className="font-semibold text-primary shrink-0">{i + 1}.</span>
              {action}
            </li>
          ))}
        </ol>
      </div>

      {/* 模块5：问医生清单速览 */}
      {(brief.doctor_questions_count ?? 0) > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-3">问医生清单速览</h3>
          <p className="text-base text-foreground mb-3">
            已整理 <span className="font-bold text-red-600">{brief.doctor_questions_count}</span> 个高优先级问题
          </p>
          <Link
            href="/doctor-questions"
            className="inline-block bg-primary text-primary-foreground rounded-xl px-5 py-2 text-base font-semibold hover:opacity-90 transition-opacity"
          >
            查看详情
          </Link>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleShare}
          className="flex-1 bg-primary text-primary-foreground rounded-xl px-8 py-4 text-xl font-semibold hover:opacity-90 transition-opacity"
        >
          📤 确认后转发给家人
        </button>
        <button
          onClick={handleExportImage}
          className="flex-1 bg-secondary text-secondary-foreground rounded-xl px-8 py-4 text-xl font-semibold hover:opacity-90 transition-opacity"
        >
          🖼️ 导出图片
        </button>
        <button
          onClick={handlePrint}
          className="flex-1 bg-muted text-foreground rounded-xl px-8 py-4 text-xl font-semibold hover:opacity-90 transition-opacity"
        >
          🖨️ 打印
        </button>
      </div>

      <div className="mt-4">
        <Link
          href="/"
          className="block w-full bg-secondary text-secondary-foreground rounded-xl px-8 py-4 text-xl font-semibold text-center hover:opacity-90 transition-opacity"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}

function InfoRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
      <span className="text-muted-foreground text-base shrink-0 sm:w-48">{label}：</span>
      <span className={`text-base leading-relaxed ${highlight ? 'text-red-700 font-semibold' : 'text-foreground'}`}>
        {value || '暂未确认'}
      </span>
    </div>
  );
}
