/**
 * WF-2/WF-3 返回字段扁平化工具
 *
 * Coze Workflow 返回的数据字段可能是 sourced 结构：
 *   { value: "藿香正气口服液", source: "material" }
 * 或变体结构：
 *   { text: "警告内容", source: "llm_analysis" }
 *
 * 前端需要的是扁平值：
 *   "藿香正气口服液" / "警告内容"
 *
 * 本模块递归处理任意深度的 sourced 字段，
 * 将 { value, source } 提取为 value，
 * 将 { text, source } 提取为 text，
 * 同时保留非 sourced 的普通对象/数组/原始值不变。
 */

/** 判断一个值是否为 sourced 结构 { value: any, source: string|null } */
function isSourcedValue(val: unknown): val is { value: unknown; source: string | null } {
  if (typeof val !== 'object' || val === null) return false;
  const keys = Object.keys(val);
  return keys.length === 2
    && keys.includes('value') && keys.includes('source')
    && (typeof (val as Record<string, unknown>).source === 'string'
      || (val as Record<string, unknown>).source === null);
}

/** 判断一个值是否为 sourced 变体 { text: any, source: string|null } */
function isSourcedTextVariant(val: unknown): val is { text: unknown; source: string | null } {
  if (typeof val !== 'object' || val === null) return false;
  const keys = Object.keys(val);
  return keys.length === 2
    && keys.includes('text') && keys.includes('source')
    && (typeof (val as Record<string, unknown>).source === 'string'
      || (val as Record<string, unknown>).source === null);
}

/**
 * 递归扁平化 sourced 字段
 *
 * 规则：
 * 1. { value: X, source: "..." } → X（递归处理 X）
 * 2. { text: X, source: "..." } → X（递归处理 X）
 * 3. 数组 → 递归处理每个元素
 * 4. 普通对象 → 递归处理每个字段
 * 5. 原始值 → 原样返回
 */
export function flattenSourcedFields<T>(data: T): T {
  if (data === null || data === undefined) return data;

  // 原始值直接返回
  if (typeof data !== 'object') return data;

  // sourced 结构 { value, source } → 提取 value 并递归处理
  if (isSourcedValue(data)) {
    return flattenSourcedFields(data.value as T);
  }

  // sourced 变体 { text, source } → 提取 text 并递归处理
  if (isSourcedTextVariant(data)) {
    return flattenSourcedFields(data.text as T);
  }

  // 数组 → 递归处理每个元素
  if (Array.isArray(data)) {
    return data.map((item) => flattenSourcedFields(item)) as T;
  }

  // 普通对象 → 递归处理每个字段
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
    result[key] = flattenSourcedFields(val);
  }
  return result as T;
}

/**
 * 防御性字段显示函数 — 兼容 string / {value, source} / {text, source} 多种格式
 *
 * 在 React 渲染中使用，确保不会把对象当 React child 渲染。
 *
 * 用法：displayField(medicine.name) → "藿香正气口服液"
 *       displayField(medicine.name, '未识别') → "藿香正气口服液" 或 "未识别"
 */
export function displayField(field: unknown, fallback: string = ''): string {
  if (field === null || field === undefined) return fallback;
  if (typeof field === 'string') return field || fallback;
  if (typeof field === 'number' || typeof field === 'boolean') return String(field);

  // sourced 结构 { value: X, source: Y }
  if (typeof field === 'object' && 'value' in field) {
    return displayField((field as { value: unknown }).value, fallback);
  }

  // sourced 变体 { text: X, source: Y }
  if (typeof field === 'object' && 'text' in field) {
    return displayField((field as { text: unknown }).text, fallback);
  }

  // 引用字段 { display_value, material_value, catalog_value, ... }
  if (typeof field === 'object' && (
    'display_value' in field || 'material_value' in field || 'catalog_value' in field
  )) {
    const citation = field as {
      display_value?: unknown;
      material_value?: unknown;
      catalog_value?: unknown;
    };
    const displayValue = [
      citation.display_value,
      citation.material_value,
      citation.catalog_value,
    ].find((value) => value !== null && value !== undefined && value !== '');
    return displayField(
      displayValue,
      fallback
    );
  }

  // 其他对象，尝试 JSON 序列化兜底
  return fallback;
}

/**
 * 防御性数组字段显示 — 处理 warnings/needs_confirmation 等
 *
 * WF-2 可能返回：
 *   ["警告1", "警告2"]                    — 扁平化后的 string[]
 *   [{text: "警告1", source: "..."}, ...] — 未扁平化的 sourced[]
 *
 * 返回纯 string[] 供 React 渲染
 */
export function displayArray(arr: unknown, extractKey?: string): string[] {
  if (typeof arr === 'object' && arr !== null && (
    'display_value' in arr || 'material_value' in arr || 'catalog_value' in arr
  )) {
    const citation = arr as {
      display_value?: unknown;
      material_value?: unknown;
      catalog_value?: unknown;
    };
    const displayValue = [
      citation.display_value,
      citation.material_value,
      citation.catalog_value,
    ].find((value) =>
      value !== null
      && value !== undefined
      && value !== ''
      && (!Array.isArray(value) || value.length > 0)
    );
    return displayArray(
      displayValue,
      extractKey
    );
  }
  if (!Array.isArray(arr)) return [];
  return arr.map((item) => {
    if (typeof item === 'string') return item;
    if (typeof item === 'number' || typeof item === 'boolean') return String(item);
    if (item == null) return '';
    if (typeof item === 'object') {
      // sourced {text, source} 格式
      if ('text' in item) return String((item as { text: unknown }).text ?? '');
      // sourced {value, source} 格式
      if ('value' in item) return String((item as { value: unknown }).value ?? '');
      // 对象：优先提取指定 key，否则尝试 short_name / name / title
      const obj = item as Record<string, unknown>;
      if (extractKey && typeof obj[extractKey] === 'string') return obj[extractKey];
      if (typeof obj.short_name === 'string') return obj.short_name;
      if (typeof obj.name === 'string') return obj.name;
      if (typeof obj.title === 'string') return obj.title;
      // 最终 fallback：JSON 序列化
      try { return JSON.stringify(item); } catch { return ''; }
    }
    return String(item ?? '');
  }).filter((s) => s.length > 0);
}
