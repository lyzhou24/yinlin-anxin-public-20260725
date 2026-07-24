/**
 * POST /api/medicine
 *
 * 接收 Material 对象，调用 WF-2 药品说明解读，返回 Medicine JSON。
 */

import { NextResponse } from 'next/server';
import { callWF2 } from '@/lib/workflows/callWF2';
import type { Material } from '@/lib/types';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json() as {
      material_json?: Material;
      user_dose_note?: string;
    };

    if (!body.material_json) {
      return NextResponse.json({
        success: false,
        data: null,
        error_code: 'MISSING_MATERIAL',
        error_message: '缺少材料分析数据',
      }, { status: 400 });
    }

    const result = await callWF2(body.material_json, body.user_dose_note);

    console.log('[/api/medicine] callWF2 result:', JSON.stringify({ success: result.success, hasMedicine: !!result.medicine, medicineName: result.medicine?.drug_name?.display_value, error: result.error_message }).slice(0, 300));

    if (!result.success) {
      const status = result.error_code === 'COZE_TOKEN_MISSING' ? 500
        : result.error_code === 'WORKFLOW_TIMEOUT' ? 504 : 502;
      return NextResponse.json({
        success: false,
        data: null,
        error_code: result.error_code,
        error_message: result.error_message,
      }, { status });
    }

    return NextResponse.json({
      success: true,
      data: result.medicine,
      error_code: null,
      error_message: null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '未知错误';
    console.error('[/api/medicine] Error:', message);
    return NextResponse.json({
      success: false,
      data: null,
      error_code: 'COZE_API_ERROR',
      error_message: '药品解读服务暂时不可用，请稍后重试',
    }, { status: 502 });
  }
}
