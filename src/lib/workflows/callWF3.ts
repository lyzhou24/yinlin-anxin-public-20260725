/**
 * WF-3 健康消费防骗分析 Workflow 调用
 *
 * 接收 WF-1 输出的 Material 对象，返回 Risk JSON。
 *
 * Workflow URL: https://c8v9jwqjvg.coze.site/run
 * 请求：{ material_json: Material }
 * 返回：{ risk_json: Risk, run_id: string }
 *
 * WF-3 的 risk_json 各字段同样可能是 sourced 结构，
 * 本模块在提取后自动扁平化。
 */

import { callWorkflow } from './client';
import { flattenSourcedFields } from './flatten';
import type { Material, Risk } from '@/lib/types';

const WF3_URL = 'https://c8v9jwqjvg.coze.site/run';

/** WF-3 健康消费防骗分析 结果 */
export interface WF3Result {
  success: boolean;
  risk: Risk | null;
  error_code: string | null;
  error_message: string | null;
  run_id?: string;
}

/** 每次调用时动态读取 WF-3 专用 Token */
function getWF3Token(): string | undefined {
  return process.env.COZE_TOKEN_WF3 || process.env.COZE_TOKEN;
}

/** 调用 WF-3 健康消费防骗分析 */
export async function callWF3(material: Material): Promise<WF3Result> {
  console.log('[callWF3] REQUEST url=%s material_type=%s material_id=%s',
    WF3_URL, material.material_type, material.material_id);

  const wf3Token = getWF3Token();
  if (!wf3Token) {
    return {
      success: false,
      risk: null,
      error_code: 'COZE_TOKEN_MISSING',
      error_message: 'COZE_TOKEN_WF3 未配置',
    };
  }

  const result = await callWorkflow({
    url: WF3_URL,
    body: {
      material_json: material,
    },
    timeout: 90000, // WF-3 含风险扫描，给 90 秒
    token: wf3Token,
  });

  console.log('[callWF3] RAW RESPONSE success=%s hasData=%s keys=%s',
    result.success,
    !!result.data,
    result.data ? Object.keys(result.data as object).join(',') : 'null');

  if (!result.success) {
    console.error('[callWF3] FAILED error_code=%s error_message=%s',
      result.error_code, result.error_message);
    return {
      success: false,
      risk: null,
      error_code: result.error_code,
      error_message: result.error_message,
    };
  }

  // 防御性提取：WF-3 可能以三种结构返回：
  // 1. { risk_json: {...} }           — 标准 Coze 输出包裹
  // 2. { data: { risk_json: {...} } } — 嵌套包裹
  // 3. { risk_level, signals, ... }   — 直接返回 risk 对象（无 risk_json 包裹）
  const raw = result.data as Record<string, unknown> | null;
  const riskFromDirect = raw?.risk_json;
  const riskFromNested = (raw?.data as Record<string, unknown> | undefined)?.risk_json;
  const riskFromFlat = raw?.risk_level ? raw : null; // 直接就是 risk 对象
  const rawRisk = riskFromDirect ?? riskFromNested ?? riskFromFlat ?? null;

  if (!rawRisk) {
    console.error('[callWF3] Cannot extract risk_json. Raw keys: %s',
      raw ? Object.keys(raw).join(',') : 'null');
    return {
      success: false,
      risk: null,
      error_code: 'INVALID_RESPONSE',
      error_message: 'WF-3 返回数据格式异常，无法提取风险分析结果',
    };
  }

  // 打印提取前的原始结构（前 800 字符，用于诊断 sourced 结构）
  console.log('[callWF3] RAW risk_json (before flatten): %s',
    JSON.stringify(rawRisk).slice(0, 800));

  // 扁平化 sourced 字段：{ value: "xxx", source: "material" } → "xxx"
  const risk = flattenSourcedFields(rawRisk) as Risk;

  console.log('[callWF3] FLATTENED risk_json (after flatten): %s',
    JSON.stringify(risk).slice(0, 800));

  return {
    success: true,
    risk,
    error_code: null,
    error_message: null,
    run_id: result.run_id,
  };
}
