'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { MOCK_EVIDENCE } from '@/lib/mock-data';

const TIMELINE_EVENTS = [
  { date: '2025年6月初', event: '长辈收到微信好友推荐，添加"健康管理师王老师"' },
  { date: '2025年7月初', event: '对方多次推送"降压灵"宣传材料' },
  { date: '2025年7月中旬', event: '长辈询问是否可替代降压药' },
  { date: '2025年7月中旬', event: '对方要求微信转账购买' },
  { date: '2025年7月16日', event: '长辈上传材料至本系统' },
];

export default function EvidencePage() {
  const evidence = MOCK_EVIDENCE;

  return (
    <div>
      <PageHeader
        title="证据材料整理"
        subtitle="整理聊天、订单、收据、转账记录等材料"
        backHref="/"
      />

      {/* 固定提示 */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 mb-6" role="alert">
        <p className="text-amber-800 text-base leading-relaxed">
          <span className="text-xl mr-1" aria-hidden="true">ℹ️</span>
          本工具不自动报警，只帮助整理材料。是否报警或投诉应由用户和家属结合实际情况决定。
        </p>
      </div>

      {/* 事件时间线 */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <h3 className="text-xl font-bold text-foreground mb-5">📅 事件时间线</h3>
        <div className="relative pl-6">
          <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-primary/30" />
          <div className="space-y-6">
            {TIMELINE_EVENTS.map((item, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-4 top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-white" />
                <p className="text-base font-semibold text-foreground">{item.date}</p>
                <p className="text-base text-muted-foreground leading-relaxed">{item.event}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 关键信息 */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-4">
        <h3 className="text-xl font-bold text-foreground mb-4">关键信息</h3>
        <div className="space-y-4">
          <InfoItem label="销售主体" value={evidence.seller} />
          <InfoItem label="产品名称" value={evidence.product_name} />
          <InfoItem label="付款金额" value={evidence.payment_amount} />
          <InfoItem label="付款账户" value={evidence.payment_account} />
          <InfoItem label="对方承诺" value={evidence.promise} />
          <InfoItem label="退款规则" value={evidence.refund_rule} />
        </div>
      </div>

      {/* 已保存证据 */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-4">
        <h3 className="text-xl font-bold text-green-700 mb-3">✅ 已保存的证据</h3>
        <ul className="space-y-2">
          {evidence.saved_evidence.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-base text-foreground leading-relaxed">
              <span className="shrink-0" aria-hidden="true">•</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* 仍缺少的证据 */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-4">
        <h3 className="text-xl font-bold text-amber-800 mb-3">⚠️ 仍缺少的证据</h3>
        <ul className="space-y-2">
          {evidence.missing_evidence.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-base text-amber-900 leading-relaxed">
              <span className="shrink-0" aria-hidden="true">•</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* 咨询/投诉/报警材料准备建议 */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-6">
        <h3 className="text-xl font-bold text-primary mb-4">📋 咨询/投诉/报警材料准备建议</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-foreground mb-2">向 12315 投诉需准备</h4>
            <ul className="space-y-1">
              {evidence.complaint_materials.map((item, i) => (
                <li key={i} className="text-base text-foreground leading-relaxed">• {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">向公安机关报案需准备</h4>
            <p className="text-base text-foreground leading-relaxed">
              整理好的聊天记录截图、转账凭证、对方账号信息、产品宣传资料、事件经过书面说明。
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">向消费者协会求助需准备</h4>
            <p className="text-base text-foreground leading-relaxed">
              购买凭证、产品包装照片、宣传材料、与对方的沟通记录、个人身份证明。
            </p>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => alert('导出证据包功能开发中，将生成包含所有材料的压缩文件。')}
          className="flex-1 bg-primary text-primary-foreground rounded-xl px-8 py-4 text-xl font-semibold hover:opacity-90 transition-opacity"
        >
          📦 导出证据包
        </button>
        <Link
          href="/family"
          className="flex-1 bg-secondary text-secondary-foreground rounded-xl px-8 py-4 text-xl font-semibold text-center hover:opacity-90 transition-opacity"
        >
          生成家属简报
        </Link>
        <Link
          href="/"
          className="flex-1 bg-muted text-foreground rounded-xl px-8 py-4 text-xl font-semibold text-center hover:opacity-90 transition-opacity"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
      <span className="text-muted-foreground text-base shrink-0 sm:w-24">{label}：</span>
      <p className="text-base text-foreground leading-relaxed">{value}</p>
    </div>
  );
}
