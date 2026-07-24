/**
 * Coze Workflow 统一调用封装
 *
 * 所有 Workflow 调用共享：
 * - Authorization Token 从环境变量动态读取
 * - 统一错误处理和超时处理
 * - JSON 序列化/反序列化
 */

/** Workflow 调用通用选项 */
interface WorkflowCallOptions {
  url: string;
  body: Record<string, unknown>;
  timeout?: number; // 毫秒，默认 60s
  token?: string; // 可选：覆盖默认 COZE_TOKEN
}

/** Workflow 调用通用结果 */
interface WorkflowResult<T> {
  success: boolean;
  data: T | null;
  error_code: string | null;
  error_message: string | null;
  run_id?: string;
}

/** 每次调用时动态读取 COZE_TOKEN，避免模块顶层固化 */
function getCozeToken(): string | undefined {
  return process.env.COZE_TOKEN;
}

/** 通用 Workflow 调用 */
export async function callWorkflow<T>(options: WorkflowCallOptions): Promise<WorkflowResult<T>> {
  const { url, body, timeout = 60000, token: overrideToken } = options;

  // 优先使用调用方传入的 token，否则从环境变量动态读取
  const token = overrideToken ?? getCozeToken();
  if (!token) {
    return {
      success: false,
      data: null,
      error_code: 'COZE_TOKEN_MISSING',
      error_message: 'COZE_TOKEN 未配置，请联系管理员',
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error(`[Workflow] ${url} returned ${response.status}: ${errText}`);

      // 映射常见错误
      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          data: null,
          error_code: 'COZE_AUTH_ERROR',
          error_message: 'Workflow 认证失败或权限不足，请检查 COZE_TOKEN',
        };
      }
      if (response.status === 502 || response.status === 503) {
        return {
          success: false,
          data: null,
          error_code: 'COZE_SERVICE_UNAVAILABLE',
          error_message: '分析服务暂时不可用，请稍后重试',
        };
      }

      return {
        success: false,
        data: null,
        error_code: 'COZE_API_ERROR',
        error_message: `Workflow 调用失败 (${response.status})`,
      };
    }

    const result = await response.json();
    return {
      success: true,
      data: result as T,
      error_code: null,
      error_message: null,
      run_id: result?.run_id,
    };
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return {
        success: false,
        data: null,
        error_code: 'WORKFLOW_TIMEOUT',
        error_message: '分析超时，请稍后重试',
      };
    }

    const message = err instanceof Error ? err.message : '未知错误';
    console.error(`[Workflow] ${url} error:`, message);
    return {
      success: false,
      data: null,
      error_code: 'COZE_API_ERROR',
      error_message: '分析服务暂时不可用，请稍后重试',
    };
  }
}
