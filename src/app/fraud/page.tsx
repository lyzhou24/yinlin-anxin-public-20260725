'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { RiskBadge } from '@/components/shared/risk-badge';
import { SafetyNotice } from '@/components/shared/safety-notice';
import {
  loadCurrentMaterial,
  deriveRiskLevel,
  getMaterialTypeLabel,
  getNeedsConfirmation,
} from '@/lib/session-material';
import { SIGNAL_CATEGORY_LABELS } from '@/lib/types';
import { displayField, displayArray } from '@/lib/workflows/flatten';
import type { Risk } from '@/lib/types';

const riskDescription: Record<'green' | 'yellow' | 'red', string> = {
  green: '根据目前材料，没有看到明显的高风险情况。',
  yellow: '目前有些身份、宣传或付款信息没有确认清楚。',
  red: '材料中出现了需要立即警惕的情况。',
};

const actionHint: Record<'green' | 'yellow' | 'red', string> = {
  green: '材料可能不完整，重要信息仍请通过正规渠道核实。',
  yellow: '请先核实清楚，再决定是否继续。',
  red: '请先停止相关操作，并请家人一起核对。',
};

/** 安全地提取 signal 中的文字字段 */
function signalField(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    // 优先取 text/value，否则取 short_name/name
    return String(obj.text ?? obj.value ?? obj.short_name ?? obj.name ?? '');
  }
  return '';
}

/** 提取 sources 列表的可读文字 */
function sourceLabels(sources: unknown[]): string[] {
  if (!Array.isArray(sources)) return [];
  return sources
    .map((s) => {
      if (typeof s === 'string') return s;
      if (s && typeof s === 'object') {
        const obj = s as Record<string, unknown>;
        return String(obj.short_name ?? obj.name ?? obj.source_id ?? '');
      }
      return '';
    })
    .filter(Boolean);
}

export default function FraudPage() {
  const [material, setMaterial] = useState<import('@/lib/types').Material | null>(null);
  const [risk, setRisk] = useState<Risk | null>(null);
  const [riskError, setRiskError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loaded = loadCurrentMaterial();
    setMaterial(loaded);

    if (!loaded) {
      setLoading(false);
      return;
    }

    fetch('/api/fraud', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ material_json: loaded }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) {
          setRiskError(json.error_message || '防骗分析服务暂时不可用');
        } else {
          const analyzedRisk = json.data as Risk;
          setRisk(analyzedRisk);
          sessionStorage.setItem(`yinling_saved_risk:${loaded.material_id}`, JSON.stringify(analyzedRisk));
        }
      })
      .catch(() => {
        setRiskError('网络连接失败，请检查网络后重试。');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-lg text-muted-foreground">正在加载分析结果...</p>
      </div>
    );
  }

  if (!material) {
    return (
      <div>
        <PageHeader title="健康消费防骗分析" backHref="/" backLabel="返回上一级" />
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 mb-6">
          <p className="text-red-700 text-base mb-4">
            <span aria-hidden="true">❌</span> 没有找到分析结果，请重新上传材料。
          </p>
          <Link
            href="/upload"
            className="inline-block bg-primary text-primary-foreground rounded-xl px-8 py-4 text-xl font-semibold hover:opacity-90 transition-opacity"
          >
            重新上传
          </Link>
          <Link
            href="/"
            className="mt-3 block bg-muted text-foreground rounded-xl px-8 py-4 text-xl font-semibold text-center hover:opacity-90 transition-opacity"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const riskLevel = risk?.risk_level ?? deriveRiskLevel(material);
  const confirmationItems = getNeedsConfirmation(material);

  return (
    <div>
      <PageHeader title="健康消费防骗分析" backHref="/" backLabel="返回上一级" />

      {/* 第一屏：风险等级 + 说明 */}
      <div className="bg-card border-2 border-border rounded-2xl p-6 mb-6 text-center">
        <h3 className="text-lg text-muted-foreground mb-3">当前风险等级</h3>
        <RiskBadge level={riskLevel} size="lg" />
        <p className="text-base text-foreground leading-relaxed mt-4">
          {riskDescription[riskLevel]}
        </p>
        <p className="text-base text-muted-foreground leading-relaxed mt-2">
          {actionHint[riskLevel]}
        </p>
      </div>

      {/* 红色：立即行动 */}
      {riskLevel === 'red' && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 mb-6" role="alert">
          <h3 className="text-2xl font-bold text-red-700 mb-4 text-center">
            <span aria-hidden="true">🛑</span> 现在该做什么
          </h3>
          <p className="text-lg font-semibold text-red-700 text-center leading-relaxed">
            先别付款 / 不要提供验证码 / 不要停掉现在吃的药 / 请让家里人一起看
          </p>
        </div>
      )}

      {/* 安全边界提示 */}
      <SafetyNotice type="fraud" className="mb-6" />

      {/* 材料类型与 OCR 原文 */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-4">
        <h3 className="text-xl font-bold text-foreground mb-4">
          🔍 材料识别结果
        </h3>
        <p className="text-base text-foreground mb-4">
          <strong>材料类型：</strong>{getMaterialTypeLabel(material.material_type)}
        </p>
        <div className="max-h-60 overflow-y-auto rounded-lg bg-white/50 p-3">
          <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap">
            {material.ocr_text || '（未识别到文字）'}
          </p>
        </div>
      </div>

      {/* 产品真实性风险 */}
      {material.authenticity_flags && material.authenticity_flags.authenticity_level !== 'not_applicable' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-4">
          <h3 className="text-xl font-bold text-amber-800 mb-4">⚠️ 产品真实性风险</h3>
          <p className="text-base text-amber-900 mb-2">
            核验结果：{material.authenticity_flags.authenticity_level_label}
          </p>
          {material.authenticity_flags.risk_signals.length > 0 && (
            <ul className="mb-2 space-y-1">
              {material.authenticity_flags.risk_signals.map((signal, i) => (
                <li key={i} className="text-base text-amber-900 leading-relaxed">
                  • {signal}
                </li>
              ))}
            </ul>
          )}
          {material.authenticity_flags.verification_suggestions.length > 0 && (
            <ul className="space-y-1">
              {material.authenticity_flags.verification_suggestions.map((suggestion, i) => (
                <li key={i} className="text-base text-amber-800 leading-relaxed">
                  💡 {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 风险信号列表 */}
      {risk && risk.signals.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-4">
          <h3 className="text-xl font-bold text-red-800 mb-4">🚨 检测到的风险</h3>
          <div className="space-y-4">
            {risk.signals.map((signal, i) => (
              <div key={i} className="bg-white border border-red-100 rounded-xl p-4">
                <div className="flex items-start gap-2 mb-2">
                  <span className="shrink-0 text-red-600 font-bold">{i + 1}.</span>
                  <div>
                    <p className="text-base font-semibold text-red-800">
                      {SIGNAL_CATEGORY_LABELS[signal.category]}
                    </p>
                    {displayField(signal.evidence_text) && (
                      <p className="text-base text-foreground leading-relaxed mt-1">
                        {displayField(signal.evidence_text)}
                      </p>
                    )}
                  </div>
                </div>
                {displayField(signal.reason) && (
                  <p className="text-base text-red-700 leading-relaxed mt-2 pl-6">
                    原因：{displayField(signal.reason)}
                  </p>
                )}
                {displayField(signal.stop_action) && (
                  <p className="text-base text-red-700 font-semibold leading-relaxed mt-2 pl-6">
                    建议：{displayField(signal.stop_action)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 核验步骤 */}
      {risk && displayArray(risk.verification_steps).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-4">
          <h3 className="text-xl font-bold text-amber-800 mb-4">✅ 建议核实步骤</h3>
          <ul className="space-y-2">
            {displayArray(risk.verification_steps).map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-base text-amber-900 leading-relaxed">
                <span className="shrink-0">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 需要保存的证据 */}
      {risk && displayArray(risk.evidence_to_keep).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-4">
          <h3 className="text-xl font-bold text-amber-800 mb-4">📁 建议保存的证据</h3>
          <ul className="space-y-2">
            {displayArray(risk.evidence_to_keep).map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-base text-amber-900 leading-relaxed">
                <span className="shrink-0">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 分析失败提示 */}
      {riskError && !risk && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-4">
          <h3 className="text-lg font-bold text-red-700 mb-2">防骗分析未能完成</h3>
          <p className="text-base text-red-700 leading-relaxed">{riskError}</p>
        </div>
      )}

      {/* 需要确认的问题 */}
      {confirmationItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-4">
          <h3 className="text-xl font-bold text-amber-800 mb-4">❓ 需要确认的问题</h3>
          <ul className="space-y-2">
            {confirmationItems.map((question, i) => (
              <li key={i} className="flex items-start gap-2 text-base text-amber-900 leading-relaxed">
                <span className="shrink-0">{i + 1}.</span>
                {question}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 关联功能入口 */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-6 mb-6">
        <h3 className="text-xl font-bold text-primary mb-4">🔗 关联功能</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/evidence"
            className="bg-white border border-primary/20 rounded-xl p-4 text-center hover:bg-primary/5 transition-colors"
          >
            <p className="text-lg font-semibold text-foreground">整理证据材料</p>
          </Link>
          <Link
            href="/compare"
            className="bg-white border border-primary/20 rounded-xl p-4 text-center hover:bg-primary/5 transition-colors"
          >
            <p className="text-lg font-semibold text-foreground">与我的药品对照</p>
          </Link>
          <Link
            href="/doctor-questions"
            className="bg-white border border-primary/20 rounded-xl p-4 text-center hover:bg-primary/5 transition-colors"
          >
            <p className="text-lg font-semibold text-foreground">生成问医生清单</p>
          </Link>
          <Link
            href="/feedback"
            className="bg-white border border-primary/20 rounded-xl p-4 text-center hover:bg-primary/5 transition-colors"
          >
            <p className="text-lg font-semibold text-foreground">结果有误？反馈复核</p>
          </Link>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/doctor-questions"
            className="flex-1 bg-primary text-primary-foreground rounded-xl px-8 py-4 text-xl font-semibold text-center hover:opacity-90 transition-opacity"
          >
            问医生清单
          </Link>
          {riskLevel !== 'red' && (
            <Link
              href="/family"
              className="flex-1 bg-secondary text-secondary-foreground rounded-xl px-8 py-4 text-xl font-semibold text-center hover:opacity-90 transition-opacity"
            >
              生成家属简报
            </Link>
          )}
        </div>
        <Link
          href="/upload"
          className="w-full bg-muted text-foreground rounded-xl px-8 py-4 text-xl font-semibold text-center hover:opacity-90 transition-opacity"
        >
          重新上传
        </Link>
        <Link
          href="/"
          className="w-full bg-muted text-foreground rounded-xl px-8 py-4 text-xl font-semibold text-center hover:opacity-90 transition-opacity"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
