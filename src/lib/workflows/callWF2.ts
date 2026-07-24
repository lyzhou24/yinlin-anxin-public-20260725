/**
 * WF-2 药品说明解读 Workflow 调用
 *
 * 接收 WF-1 输出的 Material 对象，返回 Medicine JSON。
 *
 * Workflow URL: https://7xh3j3p66w.coze.site/run
 * 请求：{ material_json: Material, user_dose_note?: string }
 * 返回：{ medicine_json: Medicine, run_id: string }
 *
 * WF-2 的 medicine_json 各字段可能是 sourced 结构：
 *   { value: "藿香正气口服液", source: "material" }
 * 本模块在提取后自动扁平化为：
 *   "藿香正气口服液"
 */

import { callWorkflow } from './client';
import { flattenSourcedFields } from './flatten';
import type { CitationField, IdentityStatus, Material, Medicine, Source, SourceType } from '@/lib/types';

const WF2_URL = 'https://7xh3j3p66w.coze.site/run';

/** WF-2 药品说明解读 结果 */
export interface WF2Result {
  success: boolean;
  medicine: Medicine | null;
  error_code: string | null;
  error_message: string | null;
  run_id?: string;
}

/** 每次调用时动态读取 WF-2 专用 Token */
function getWF2Token(): string | undefined {
  return process.env.COZE_TOKEN_WF2 || process.env.COZE_TOKEN;
}

function getMaterialSourceType(material: Material): SourceType {
  if (material.material_type === 'medicine_leaflet') return 'USER_INSTRUCTION';
  if (material.material_type === 'hospital_prescription') return 'USER_PRESCRIPTION';
  return 'USER_PACKAGE';
}

function getOcrSource(material: Material): Source {
  return {
    source_id: `OCR-${material.material_id}`,
    source_type: getMaterialSourceType(material),
    short_name: '来自上传内容的OCR识别结果，仅供参考，具体内容请以包装文字为准',
    location: '上传图片OCR识别',
  };
}

function readRawField(raw: Record<string, unknown>, names: string[]): unknown {
  for (const name of names) {
    if (raw[name] !== undefined && raw[name] !== null) return raw[name];
  }
  return undefined;
}

function readCitationValue(field: unknown): unknown {
  if (field && typeof field === 'object') {
    const record = field as Record<string, unknown>;
    if ('display_value' in record || 'material_value' in record || 'catalog_value' in record) {
      return record.display_value ?? record.material_value ?? record.catalog_value;
    }
    if ('value' in record) return readCitationValue(record.value);
    if ('text' in record) return readCitationValue(record.text);
  }
  return flattenSourcedFields(field);
}

function readSources(field: unknown, material: Material, hasValue: boolean): Source[] {
  if (field && typeof field === 'object') {
    const sources = (field as Record<string, unknown>).sources;
    if (Array.isArray(sources) && sources.length > 0) return sources as Source[];
  }
  return hasValue ? [getOcrSource(material)] : [];
}

function normalizeStringField(field: unknown, material: Material, fallback = ''): CitationField<string> {
  const rawValue = readCitationValue(field);
  const value = typeof rawValue === 'string'
    ? rawValue.trim()
    : typeof rawValue === 'number'
      ? String(rawValue)
      : fallback;
  const original = field && typeof field === 'object' ? field as Partial<CitationField<string>> : {};
  return {
    material_value: value || null,
    catalog_value: original.catalog_value ?? null,
    display_value: value || null,
    status: original.status ?? (value ? 'material_only' : 'missing'),
    sources: readSources(field, material, Boolean(value)),
    ...(!value ? { missing_message: original.missing_message || '当前材料中未识别到这项信息。' } : {}),
  };
}

function normalizeArrayField(field: unknown, material: Material): CitationField<string[]> {
  const rawValue = readCitationValue(field);
  const values = Array.isArray(rawValue)
    ? rawValue.map((item) => String(readCitationValue(item) ?? '').trim()).filter(Boolean)
    : typeof rawValue === 'string' && rawValue.trim()
      ? rawValue.split(/\r?\n|；|;/).map((item) => item.trim()).filter(Boolean)
      : [];
  const original = field && typeof field === 'object' ? field as Partial<CitationField<string[]>> : {};
  return {
    material_value: values,
    catalog_value: original.catalog_value ?? null,
    display_value: values,
    status: original.status ?? (values.length > 0 ? 'material_only' : 'missing'),
    sources: readSources(field, material, values.length > 0),
    ...(values.length === 0 ? { missing_message: original.missing_message || '当前材料中未识别到这项信息。' } : {}),
  };
}

function extractDrugNameFromOcr(ocrText: string): string {
  const labeled = ocrText.match(/(?:通用名称|药品名称|品名)[：:\s]*([^\r\n，。；;]{2,40})/);
  if (labeled?.[1]) return labeled[1].trim();

  const dosageForm = '(?:胶囊|口服液|颗粒|混悬液|注射液|滴眼液|乳膏|软膏|喷雾剂|糖浆|丸|散|片|栓|贴)';
  const candidates = ocrText
    .split(/[\s，,。；;：:（）()【】[\]<>《》]+/)
    .map((token) => token.match(new RegExp(`([\\u4e00-\\u9fa5A-Za-z0-9·]{2,24}${dosageForm})`))?.[1] || '')
    .filter((candidate) =>
      Boolean(candidate)
      && !/(说明书|生产企业|包装规格|用法用量|批准文号|有效期)/.test(candidate)
    )
    .sort((left, right) => left.length - right.length);
  return candidates[0] || '';
}

function normalizeMedicine(rawMedicine: unknown, material: Material): Medicine {
  const raw = rawMedicine && typeof rawMedicine === 'object'
    ? rawMedicine as Record<string, unknown>
    : {};
  const ocrDrugName = extractDrugNameFromOcr(material.ocr_text || '');
  const drugName = normalizeStringField(
    readRawField(raw, ['drug_name', 'medicine_name', 'product_name', 'name']),
    material,
    ocrDrugName
  );
  const rawIdentityStatus = readRawField(raw, ['identity_status', 'recognition_status']);
  const allowedIdentityStatuses: IdentityStatus[] = ['confirmed', 'needs_confirmation', 'unclear', 'multiple_candidates'];
  const identityStatus = allowedIdentityStatuses.includes(rawIdentityStatus as IdentityStatus)
    ? rawIdentityStatus as IdentityStatus
    : drugName.display_value
      ? 'needs_confirmation'
      : 'unclear';
  const warnings = normalizeArrayField(
    readRawField(raw, ['important_warnings', 'warnings', 'precautions']),
    material
  );

  if ((warnings.display_value?.length ?? 0) === 0) {
    warnings.display_value = ['当前材料未识别到明确的重要提醒，请按说明书使用并咨询医生或药师。'];
    warnings.material_value = warnings.display_value;
    warnings.status = 'unclear';
    warnings.sources = [{
      source_id: `SYSTEM-${material.material_id}`,
      source_type: 'MANUAL_CONFIRMATION',
      short_name: '系统安全提示（非材料原文）',
    }];
  }

  return {
    medicine_id: String(readRawField(raw, ['medicine_id', 'id']) || `MED-${material.material_id}`),
    identity_status: identityStatus,
    drug_name: drugName,
    specification: normalizeStringField(readRawField(raw, ['specification', 'spec']), material),
    approval_number: normalizeStringField(readRawField(raw, ['approval_number', 'approval_no']), material),
    manufacturer: normalizeStringField(readRawField(raw, ['manufacturer', 'producer']), material),
    indication_from_instruction: normalizeStringField(readRawField(raw, ['indication_from_instruction', 'indication', 'indications']), material),
    dose_from_material: normalizeStringField(readRawField(raw, ['dose_from_material', 'dose', 'dosage']), material),
    frequency_from_material: normalizeStringField(readRawField(raw, ['frequency_from_material', 'frequency']), material),
    timing_from_material: normalizeStringField(readRawField(raw, ['timing_from_material', 'timing']), material),
    important_warnings: warnings,
    contraindications: normalizeArrayField(readRawField(raw, ['contraindications', 'contraindication']), material),
    adverse_reactions: normalizeArrayField(readRawField(raw, ['adverse_reactions', 'side_effects']), material),
    storage: normalizeStringField(readRawField(raw, ['storage', 'storage_requirements']), material),
    needs_confirmation: Array.isArray(raw.needs_confirmation)
      ? raw.needs_confirmation.map((item) => String(readCitationValue(item) ?? '')).filter(Boolean)
      : [],
    source_note: typeof raw.source_note === 'string'
      ? raw.source_note
      : '来自上传内容的OCR识别结果仅供参考，请以药品包装、说明书及专业人员意见为准。',
  };
}

/** 调用 WF-2 药品说明解读 */
export async function callWF2(
  material: Material,
  userDoseNote?: string
): Promise<WF2Result> {
  console.log('[callWF2] REQUEST url=%s material_type=%s material_id=%s',
    WF2_URL, material.material_type, material.material_id);

  const wf2Token = getWF2Token();
  if (!wf2Token) {
    return {
      success: false,
      medicine: null,
      error_code: 'COZE_TOKEN_MISSING',
      error_message: 'COZE_TOKEN_WF2 未配置',
    };
  }

  const result = await callWorkflow({
    url: WF2_URL,
    body: {
      material_json: material,
      user_dose_note: userDoseNote ?? '',
    },
    timeout: 90000, // WF-2 含知识库查询，给 90 秒
    token: wf2Token,
  });

  console.log('[callWF2] RAW RESPONSE success=%s hasData=%s keys=%s',
    result.success,
    !!result.data,
    result.data ? Object.keys(result.data as object).join(',') : 'null');

  if (!result.success) {
    console.error('[callWF2] FAILED error_code=%s error_message=%s',
      result.error_code, result.error_message);
    return {
      success: false,
      medicine: null,
      error_code: result.error_code,
      error_message: result.error_message,
    };
  }

  // 防御性提取：Coze 返回可能是 { medicine_json: {...} } 或 { data: { medicine_json: {...} } }
  const raw = result.data as Record<string, unknown> | null;
  const medicineFromDirect = raw?.medicine_json;
  const medicineFromNested = (raw?.data as Record<string, unknown> | undefined)?.medicine_json;
  const rawMedicine = medicineFromDirect ?? medicineFromNested ?? null;

  if (!rawMedicine) {
    console.error('[callWF2] Cannot extract medicine_json. Raw keys: %s',
      raw ? Object.keys(raw).join(',') : 'null');
    return {
      success: false,
      medicine: null,
      error_code: 'INVALID_RESPONSE',
      error_message: 'WF-2 返回数据格式异常，无法提取药品信息',
    };
  }

  // 打印提取前的原始结构（前 800 字符，用于诊断 sourced 结构）
  console.log('[callWF2] RAW medicine_json (before flatten): %s',
    JSON.stringify(rawMedicine).slice(0, 800));

  // 统一为带来源的 CitationField，并在工作流漏传药名时从 OCR 原文中保守兜底。
  const medicine = normalizeMedicine(rawMedicine, material);

  console.log('[callWF2] FLATTENED medicine_json (after flatten): %s',
    JSON.stringify(medicine).slice(0, 800));

  return {
    success: true,
    medicine,
    error_code: null,
    error_message: null,
    run_id: result.run_id,
  };
}
