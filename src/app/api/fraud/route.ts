/**
 * POST /api/fraud
 *
 * 接收 Material 对象，调用 WF-3 健康消费防骗分析，返回 Risk JSON。
 */

import { NextResponse } from 'next/server';
import { callWF3 } from '@/lib/workflows/callWF3';
import type { Material } from '@/lib/types';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json() as {
      material_json?: Material;
    };

    if (!body.material_json) {
      return NextResponse.json({
        success: false,
        data: null,
        error_code: 'MISSING_MATERIAL',
        error_message: '缺少材料分析数据',
      }, { status: 400 });
    }

    const result = await callWF3(body.material_json);

    console.log('[/api/fraud] callWF3 result:', JSON.stringify({ success: result.success, hasRisk: !!result.risk, riskLevel: result.risk?.risk_level, error: result.error_message }).slice(0, 300));

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
      data: result.risk,
      error_code: null,
      error_message: null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '未知错误';
    console.error('[/api/fraud] Error:', message);
    return NextResponse.json({
      success: false,
      data: null,
      error_code: 'COZE_API_ERROR',
      error_message: '防骗分析服务暂时不可用，请稍后重试',
    }, { status: 502 });
  }
}
