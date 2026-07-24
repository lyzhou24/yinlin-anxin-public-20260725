import { NextRequest, NextResponse } from 'next/server';

const COZE_WF1_URL = 'https://wxzr85dnjt.coze.site/run';

interface AnalyzeRequestBody {
  file_url: string;
  user_corrected_type?: string;
}

/**
 * 将 WF-1 返回的错误映射为用户友好的错误码
 */
function mapCozeError(statusCode: number, errorBody: string): { error_code: string; error_message: string; httpStatus: number } {
  try {
    const parsed = JSON.parse(errorBody);
    const detail = parsed.detail || parsed;
    const errorMsg = detail.error_message || '';
    const errorCode = detail.error_code || 0;

    // WF-1 图片质量节点错误：图片太小
    if (errorMsg.includes('too small') || errorMsg.includes('dimension')) {
      return {
        error_code: 'BLURRY_IMAGE',
        error_message: '照片不够清晰或尺寸太小，建议对准材料重新拍摄',
        httpStatus: 200,
      };
    }

    // WF-1 URL 不可达
    if (errorMsg.includes('URL is not reachable') || errorMsg.includes('network error')) {
      return {
        error_code: 'UPLOAD_FAILED',
        error_message: '图片地址无法访问，请重新上传',
        httpStatus: 200,
      };
    }

    // WF-1 OCR 失败
    if (errorMsg.includes('OCR') || errorCode === 201006) {
      return {
        error_code: 'OCR_FAILED',
        error_message: '未能识别文字，请调整光线后重试',
        httpStatus: 200,
      };
    }

    // WF-1 分类失败
    if (errorMsg.includes('classification') || errorCode === 201007) {
      return {
        error_code: 'CLASSIFICATION_FAILED',
        error_message: '系统暂时无法判断材料类型，请手动选择材料类型',
        httpStatus: 200,
      };
    }
  } catch {
    // JSON 解析失败，走默认处理
  }

  return {
    error_code: 'COZE_API_ERROR',
    error_message: '分析服务暂时不可用，请稍后重试',
    httpStatus: statusCode >= 500 ? 502 : 500,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequestBody = await request.json();
    const { file_url, user_corrected_type } = body;

    if (!file_url) {
      return NextResponse.json(
        { success: false, error_code: 'MISSING_FILE_URL', error_message: '缺少文件地址参数' },
        { status: 400 }
      );
    }

    const token = process.env.COZE_TOKEN;
    if (!token) {
      console.error('[/api/analyze] COZE_TOKEN is not configured');
      return NextResponse.json(
        { success: false, error_code: 'COZE_API_ERROR', error_message: '分析服务配置异常，请联系管理员' },
        { status: 500 }
      );
    }

    // 调用 Coze WF-1
    const cozeResponse = await fetch(COZE_WF1_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_url,
        ...(user_corrected_type ? { user_corrected_type } : {}),
      }),
    });

    if (!cozeResponse.ok) {
      const errorText = await cozeResponse.text();
      console.error('[/api/analyze] Coze API error:', cozeResponse.status, errorText);

      const mapped = mapCozeError(cozeResponse.status, errorText);
      return NextResponse.json(
        { success: false, error_code: mapped.error_code, error_message: mapped.error_message },
        { status: mapped.httpStatus }
      );
    }

    const cozeData = await cozeResponse.json();

    // Coze WF-1 返回格式: { material_json: {...}, run_id: "..." }
    const materialJson = cozeData.material_json || cozeData.data || cozeData;
    const runId = cozeData.run_id || '';

    // 检查 WF-1 是否返回了业务级错误
    if (materialJson.error_code) {
      return NextResponse.json({
        success: false,
        error_code: materialJson.error_code,
        error_message: materialJson.error_message || '分析过程中出现错误',
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...materialJson,
        run_id: runId,
      },
    });
  } catch (error) {
    console.error('[/api/analyze] Error:', error);
    return NextResponse.json(
      { success: false, error_code: 'COZE_API_ERROR', error_message: '分析服务暂时不可用，请稍后重试' },
      { status: 500 }
    );
  }
}
