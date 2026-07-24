import type { Material } from './types';

const STORAGE_KEY = 'yinling_current_material';

export function saveCurrentMaterial(material: Material): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(material));
  }
}

export function loadCurrentMaterial(): Material | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Material;
  } catch {
    return null;
  }
}

export function clearCurrentMaterial(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

export function deriveRiskLevel(material: Material): 'green' | 'yellow' | 'red' {
  const level = material.authenticity_flags?.authenticity_level;
  if (level === 'suspected_counterfeit') return 'red';
  if (level === 'needs_verification') return 'yellow';
  return 'green';
}

export function getMaterialTypeLabel(materialType: Material['material_type']): string {
  const labels: Record<Material['material_type'], string> = {
    regular_medicine: '正规药品',
    medicine_leaflet: '药品说明书',
    hospital_prescription: '医院处方',
    multiple_medicines: '多种药品',
    health_supplement: '保健食品',
    ordinary_food: '普通食品',
    medical_device: '医疗器械',
    health_promotion: '健康宣传材料',
    sales_chat: '推销聊天记录',
    payment_proof: '订单或付款凭证',
    unknown: '暂时无法判断',
  };
  return labels[materialType] ?? '未知材料';
}

export function getRouteByType(materialType: Material['material_type']): string | null {
  if (['regular_medicine', 'medicine_leaflet', 'hospital_prescription'].includes(materialType)) {
    return '/medicine';
  }
  if (
    ['health_supplement', 'ordinary_food', 'medical_device', 'health_promotion', 'sales_chat', 'payment_proof'].includes(
      materialType
    )
  ) {
    return '/fraud';
  }
  return null;
}

export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.85) return '识别较明确';
  if (confidence >= 0.6) return '需要您确认';
  return '我们还不能确定';
}

const MISSING_FIELD_LABELS: Record<string, string> = {
  drug_name: '药品名称',
  specification: '规格',
  approval_number: '批准文号',
  manufacturer: '生产企业',
  batch_number: '批号',
  expiry_date: '有效期',
  indication_from_instruction: '适应症',
  dose_from_material: '单次用量',
  frequency_from_material: '用药频次',
  timing_from_material: '用药时间',
  important_warnings: '重要提醒',
  contraindications: '禁忌',
  adverse_reactions: '常见不良反应',
  storage: '储存要求',
};

export function getNeedsConfirmation(material: Material): string[] {
  const items: string[] = [];

  const missingLabels =
    material.missing_fields
      ?.map((f) => MISSING_FIELD_LABELS[f])
      .filter((label): label is string => Boolean(label)) ?? [];

  if (missingLabels.length > 0) {
    const joined = missingLabels.join('、');
    items.push(`这张材料上缺少“${joined}”，建议重新拍一张。`);
  } else if (material.missing_fields && material.missing_fields.length > 0) {
    items.push('有些信息没有识别清楚，建议重新拍一张。');
  }

  const flags = material.authenticity_flags;
  if (flags && flags.authenticity_level !== 'not_applicable' && flags.authenticity_level !== 'likely_authentic') {
    if (flags.risk_signals && flags.risk_signals.length > 0) {
      items.push(...flags.risk_signals);
    }
    if (flags.verification_suggestions && flags.verification_suggestions.length > 0) {
      items.push(...flags.verification_suggestions);
    }
  }
  return items;
}
