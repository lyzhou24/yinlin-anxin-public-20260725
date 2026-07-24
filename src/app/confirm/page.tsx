'use client';

import { useState, useEffect } from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import {
  loadCurrentMaterial,
  saveCurrentMaterial,
  getMaterialTypeLabel,
  getRouteByType,
  getConfidenceLabel,
} from '@/lib/session-material';
import { MATERIAL_TYPE_LABELS } from '@/lib/types';
import type { MaterialType, Material } from '@/lib/types';
import { displayField } from '@/lib/workflows/flatten';

const ALL_MATERIAL_TYPES: MaterialType[] = [
  'regular_medicine',
  'medicine_leaflet',
  'hospital_prescription',
  'multiple_medicines',
  'health_supplement',
  'ordinary_food',
  'medical_device',
  'health_promotion',
  'sales_chat',
  'payment_proof',
  'unknown',
];

function ConfirmPage() {
  const [material, setMaterial] = useState<import('@/lib/types').Material | null>(null);
  const [selectedType, setSelectedType] = useState<MaterialType>('unknown');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadCurrentMaterial();
    if (!loaded) {
      setError('没有找到分析结果，请重新上传材料。');
      setLoading(false);
      return;
    }
    setMaterial(loaded);
    setSelectedType(loaded.material_type);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-lg text-muted-foreground">正在加载分析结果...</p>
      </div>
    );
  }

  if (error || !material) {
    return (
      <div>
        <PageHeader
          title="请确认这是什么材料"
          subtitle="系统识别可能有误，请您看一眼再继续。"
          backHref="/"
          backLabel="返回上一级"
        />
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 mb-6">
          <p className="text-red-700 text-base mb-4">
            <span aria-hidden="true">❌</span> {error || '分析结果加载失败'}
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

  const confidenceLabel = getConfidenceLabel(material.confidence);
  const isLowConfidence = material.confidence < 0.6;
  const resultRoute = getRouteByType(selectedType);

  const handleConfirmType = () => {
    const correctedMaterial: Material = {
      ...material,
      material_type: selectedType,
      type_label: MATERIAL_TYPE_LABELS[selectedType],
      route: resultRoute === '/medicine' ? 'medicine' : resultRoute === '/fraud' ? 'fraud' : 'manual_confirm',
    };
    saveCurrentMaterial(correctedMaterial);
    if (selectedType !== material.material_type) {
      sessionStorage.setItem(`yinling_classification_correction:${material.material_id}`, JSON.stringify({
        original_type: material.material_type,
        user_corrected_type: selectedType,
      }));
    }
  };

  return (
    <div>
      <PageHeader
        title="请确认这是什么材料"
        subtitle="系统识别可能有误，请您看一眼再继续。"
        backHref="/"
        backLabel="返回上一级"
      />

      {/* 系统判断结果 */}
      <div className="bg-card border-2 border-border rounded-2xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">系统判断结果</h3>

        <div className="space-y-4">
          {/* 材料类型 */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
            <span className="text-muted-foreground text-base shrink-0 sm:w-28">我们认为这是：</span>
            <span className="text-foreground text-base font-semibold">
              {getMaterialTypeLabel(material.material_type)}
            </span>
          </div>

          {/* 识别结果 */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
            <span className="text-muted-foreground text-base shrink-0 sm:w-28">识别结果：</span>
            <div className="flex items-center gap-3">
              <span className={`text-base font-semibold ${
                confidenceLabel === '识别较明确' ? 'text-green-700' : 'text-amber-700'
              }`}>
                {confidenceLabel}
              </span>
            </div>
          </div>

          {/* 关键文字摘要 */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
            <span className="text-muted-foreground text-base shrink-0 sm:w-28">关键文字：</span>
            <div className="text-foreground text-base leading-relaxed whitespace-pre-wrap bg-muted/50 rounded-lg p-3 flex-1 break-words max-h-60 overflow-y-auto">
              {material.ocr_text || '（未识别到文字）'}
            </div>
          </div>

          {/* 分类理由 */}
          {material.classification_reason && (
            <div className="flex items-start gap-3">
              <span className="text-muted-foreground text-base shrink-0 w-28">分类理由：</span>
              <span className="text-foreground text-base leading-relaxed">
                {material.classification_reason}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 药品真实性风险提示 */}
      {material.authenticity_flags && material.authenticity_flags.authenticity_level !== 'not_applicable' && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 mb-6" role="alert">
          <h4 className="text-lg font-bold text-amber-800 mb-2">
            <span aria-hidden="true">⚠️</span> 药品真实性风险提示：{material.authenticity_flags.authenticity_level_label}
          </h4>
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

      {/* 识别不确定提示 */}
      {isLowConfidence && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 mb-6" role="alert">
          <h4 className="text-lg font-bold text-amber-800 mb-1">我们还不能确定</h4>
          <p className="text-amber-800 text-base leading-relaxed">
            请选择正确的材料类别，或重新上传更清楚的照片。
          </p>
        </div>
      )}

      {/* 手动选择材料类型 */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-3">
          如果类别不对，请选择正确类别：
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {ALL_MATERIAL_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`text-left rounded-xl border-2 px-4 py-3 text-base transition-all hover:border-primary ${
                type === (selectedType || material.material_type)
                  ? 'border-primary bg-primary/5 font-semibold text-primary'
                  : 'border-border text-foreground'
              }`}
            >
              {MATERIAL_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-col sm:flex-row gap-4">
        {resultRoute ? (
          <Link
            href={resultRoute}
            onClick={handleConfirmType}
            className="flex-1 bg-primary text-primary-foreground rounded-xl px-8 py-4 text-xl font-semibold text-center hover:opacity-90 transition-opacity"
          >
            下一步
          </Link>
        ) : (
          <button
            disabled
            className="flex-1 bg-primary text-primary-foreground rounded-xl px-8 py-4 text-xl font-semibold text-center hover:opacity-90 transition-opacity"
          >
            下一步
          </button>
        )}
        <Link
          href="/upload"
          className="flex-1 bg-secondary text-secondary-foreground rounded-xl px-8 py-4 text-xl font-semibold text-center hover:opacity-90 transition-opacity"
        >
          重新拍照
        </Link>
        <Link
          href="/"
          onClick={(event) => {
            if (!window.confirm('是否返回首页？\n系统将不会保留未上传的图片或未保存的分析结果')) event.preventDefault();
          }}
          className="flex-1 bg-muted text-foreground rounded-xl px-8 py-4 text-xl font-semibold text-center hover:opacity-90 transition-opacity"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}

export default function ConfirmPageWrapper() {
  return (
    <Suspense fallback={
      <div>
        <PageHeader
          title="材料分类确认"
          subtitle="请确认系统识别的材料类型是否正确"
          backHref="/"
          backLabel="返回上一级"
        />
        <div className="text-center py-12">
          <div className="inline-block w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-lg text-muted-foreground">正在加载分析结果...</p>
        </div>
      </div>
    }>
      <ConfirmPage />
    </Suspense>
  );
}
