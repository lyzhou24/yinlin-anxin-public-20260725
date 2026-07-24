# WF-1 材料预处理与安全分析

## 状态：已完成部署

**Coze 项目 ID**：7663130612399620105  
**调用端点**：`POST https://wxzr85dnjt.coze.site/run`  
**认证方式**：`Authorization: Bearer ${COZE_TOKEN}`  
**前端 API 路由**：`POST /api/analyze`（Next.js API Route 透传）

---

## 功能

负责用户上传材料的预处理、安全分析和路由判断，具体包括：

1. OCR 文字提取
2. 图片视觉理解
3. 材料分类判断（11 种类型 → 3 条路由）
4. 隐私信息检测（身份证号、银行卡号、验证码、手机号、住址等）
5. 仿冒药/假药初步风险筛查
6. 输出结构化 Material v2 JSON

---

## 输入

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `file_url` | string | 是 | 公网可访问的图片 URL，由 `/api/upload` 接口返回 |

请求示例：
```json
{
  "file_url": "https://coze-coding-project.tos.coze.site/coze_storage_xxx/materials/1784392607720_abc123.jpg?sign=xxx"
}
```

---

## 输出

### 成功响应

```json
{
  "material_json": {
    "material_id": "mat_xxxxx",
    "file_url": "https://coze-coding-project.tos.coze.site/...",
    "material_type": "medicine_leaflet",
    "type_label": "药品说明书",
    "confidence": 0.92,
    "confidence_level": "high",
    "quality": {
      "is_clear": true,
      "quality_score": 0.92,
      "issues": []
    },
    "ocr_text": "【药品名称】氨氯地平贝那普利片\n【规格】5mg:10mg\n...",
    "image_description": "{\"form\":\"药品说明书\",\"visual_features\":\"折叠式纸张，小字密集排版\",\"key_entities\":[\"氨氯地平贝那普利片\"],\"has_payment_info\":false,\"has_qr_code\":false,\"has_contact_info\":false}",
    "missing_fields": ["生产批号未识别", "有效期未识别"],
    "route": "medicine",
    "classification_reason": "文字包含药品说明书典型栏目，排版为折叠式密集文字",
    "sensitive_info_detected": {
      "has_sensitive_info": false,
      "detected_types": [],
      "detected_types_labels": [],
      "user_confirmed": false
    },
    "authenticity_flags": {
      "authenticity_level": "likely_authentic",
      "authenticity_level_label": "初步判断为正品",
      "risk_signals": [],
      "verification_suggestions": []
    }
  },
  "run_id": "run_xxxxx"
}
```

### 错误响应

WF-1 通过 Coze 平台返回错误时，格式为：

```json
{
  "detail": {
    "error_code": 201005,
    "error_message": "验证失败: URL is not reachable ...",
    "stack_trace": ["..."]
  }
}
```

Next.js API Route (`/api/analyze`) 会将 Coze 技术错误映射为用户友好的错误码：

| Coze 错误特征 | 映射错误码 | 用户提示 |
|---------------|-----------|---------|
| `too small` / `dimension` | `BLURRY_IMAGE` | 照片不够清晰或尺寸太小，建议对准材料重新拍摄 |
| `URL is not reachable` | `UPLOAD_FAILED` | 图片地址无法访问，请重新上传 |
| `OCR` / error_code=201006 | `OCR_FAILED` | 未能识别文字，请调整光线后重试 |
| `classification` / error_code=201007 | `CLASSIFICATION_FAILED` | 系统暂时无法判断材料类型，请手动选择 |
| 其他 | `COZE_API_ERROR` | 分析服务暂时不可用，请稍后重试 |

---

## Workflow 节点

| 序号 | 节点名称 | 节点类型 | 使用模型 | 说明 |
|------|---------|---------|---------|------|
| 1 | 图片理解与OCR | LLM（视觉） | doubao-seed-2-0-lite | 提取图片中文字和视觉特征 |
| 2 | 材料分类 | LLM（文本） | doubao-seed-2-0-lite | 基于OCR和视觉描述，判断11种材料类型 |
| 3 | 隐私信息检测 | LLM（视觉） | doubao-seed-2-0-mini | 检测图片中是否包含身份证号、银行卡号等敏感信息 |
| 4 | 仿冒药初筛 | LLM（文本） | doubao-seed-2-0-lite | 仅对药品类材料判断是否疑似仿冒（视觉+OCR层面） |
| 5 | JSON结构化输出 | Code | — | 将各节点输出聚合为 Material v2 JSON |

### 节点间数据流

```
Start → N1 图片理解与OCR → N2 材料分类 → N3 隐私信息检测 → N4 仿冒药初筛 → N5 JSON输出 → End
              │                   │                 │                   │
              ├─ ocr_text         ├─ material_type  ├─ has_sensitive   ├─ authenticity_level
              ├─ image_description ├─ type_label     ├─ detected_types  ├─ risk_signals
              └─ quality          ├─ confidence     └─ types_labels    └─ verification_suggestions
                                  └─ classification_reason
```

---

## 分类与路由

### material_type 枚举

| material_type | type_label | route |
|---------------|-----------|-------|
| `regular_medicine` | 正规药品 | medicine |
| `medicine_leaflet` | 药品说明书 | medicine |
| `hospital_prescription` | 医院处方 | medicine |
| `multiple_medicines` | 多种药品 | medicine |
| `health_supplement` | 保健食品 | fraud |
| `ordinary_food` | 普通食品 | fraud |
| `medical_device` | 医疗器械 | fraud |
| `health_promotion` | 健康宣传材料 | fraud |
| `sales_chat` | 推销聊天记录 | fraud |
| `payment_proof` | 订单或付款凭证 | fraud |
| `unknown` | 暂时无法判断 | manual_confirm |

### 特殊路由规则

- `confidence < 0.5` → 无论 material_type 为何，route 强制为 `manual_confirm`

### confidence_level 映射

| confidence 范围 | confidence_level | 前端行为 |
|----------------|-----------------|---------|
| >= 0.85 | high | 直接展示 |
| 0.50 - 0.84 | medium | 展示但标注"中等置信度" |
| < 0.50 | low | 强制用户手动确认 |

---

## 仿冒药判断规则

### authenticity_level

| 等级 | 触发条件 | 前端展示 |
|------|---------|---------|
| `likely_authentic` | 批准文号格式正确、厂家信息清晰、包装正常 | 不额外提示 |
| `needs_verification` | 批准文号格式异常或不完整、厂家信息模糊 | 黄色提示"需进一步核验" |
| `suspected_counterfeit` | 批准文号明显不符规范、包装印刷质量差、药名与知名药品高度相似 | 红色警告"存在疑似仿冒特征" |
| `not_applicable` | 非药品类材料 | 不展示 |

### 安全边界

- `suspected_counterfeit` 不等于"这是假药"，仅表示"存在疑似仿冒的特征，需要专业核验"
- WF-1 只做视觉+OCR 层面的初步判断，不做数据库真实性查询
- WF-2（药品解读）会结合知识库做更深入核验

---

## 隐私信息检测规则

### detected_types 枚举

| 类型值 | 中文标签 | 说明 |
|--------|---------|------|
| `id_card` | 身份证号 | 18位身份证号 |
| `bank_card` | 银行卡号 | 16-19位银行卡号 |
| `verification_code` | 验证码 | 短信/支付验证码 |
| `phone_number` | 手机号 | 11位手机号 |
| `address` | 住址 | 详细家庭住址 |
| `medical_record_number` | 病历号 | 医院病历编号 |
| `qr_code` | 二维码 | 可能包含个人信息的二维码 |
| `name` | 姓名 | 真实姓名 |

### 前端处理流程

```
检测到敏感信息 (has_sensitive_info = true)
  ├── 高亮标记敏感区域
  ├── 展示提示："检测到图片中可能包含身份证/银行卡等敏感信息，建议遮挡后重新拍摄"
  ├── 按钮 A："重新上传" → 返回 /upload
  ├── 按钮 B："我已确认，继续识别" → 继续后续流程
  └── 按钮 C："取消上传" → 返回首页
```

---

## 与 Next.js 前端的集成

### 数据流

```
用户选择图片 (upload/page.tsx)
    │
    ├─ Step 1: POST /api/upload (multipart/form-data)
    │   └─ S3Storage.uploadFile → generatePresignedUrl → file_url
    │
    ├─ Step 2: POST /api/analyze (JSON: { file_url })
    │   └─ fetch Coze WF-1 → material_json
    │
    ├─ Step 3: sessionStorage.setItem('material_json', JSON.stringify(material))
    │
    └─ Step 4: router.push('/confirm?material_id=xxx')
        │
        └─ confirm/page.tsx 从 sessionStorage 读取 Material v2
            ├── 展示 type_label / confidence / ocr_text / classification_reason
            ├── 展示 sensitive_info_detected（如有）
            ├── 展示 authenticity_flags（如有）
            └── 确认后按 route 跳转：medicine → /medicine, fraud → /fraud
```

### 环境变量

| 变量名 | 说明 | 来源 |
|--------|------|------|
| `COZE_TOKEN` | Coze API 访问令牌 | 手动配置 |
| `COZE_BUCKET_ENDPOINT_URL` | 对象存储代理端点 | coze dev 自动注入 |
| `COZE_BUCKET_NAME` | 桶名称 | coze dev 自动注入 |
| `COZE_WORKLOAD_IDENTITY_*` | Workload Identity 认证 | coze dev 自动注入 |

---

## 测试情况

### 沙箱环境验证

| 测试场景 | 结果 | 说明 |
|---------|------|------|
| 图片上传到 S3 | ✅ 通过 | 返回签名 URL，公网可访问 |
| 签名 URL 被 WF-1 访问 | ✅ 通过 | Content-Type: image/png |
| WF-1 完整调用 | ✅ 通过 | 22.2s 返回 Material v2 |
| 错误映射（URL不可达） | ✅ 通过 | 正确映射为 UPLOAD_FAILED |
| 错误映射（图片太小） | ✅ 通过 | 正确映射为 BLURRY_IMAGE |
| Token 缺失 | ✅ 通过 | 返回 COZE_API_ERROR |
| 参数缺失 | ✅ 通过 | 返回 MISSING_FILE_URL |

### 已知限制

1. `quality` 字段：WF-1 返回 `object`（含 is_clear/quality_score/issues），当前 TypeScript 类型定义为 `string`（"good"/"fair"/"poor"），待后续对齐
2. 签名 URL 有效期 1 小时，超时需重新上传
3. WF-1 调用耗时约 20-30 秒，前端需有加载状态提示

---

## 后续 WF-2 接口基线

WF-2（药品说明解读）的输入将依赖 WF-1 输出的 Material 对象：

```json
{
  "material_id": "从 WF-1 获取",
  "material_type": "从 WF-1 获取",
  "ocr_text": "从 WF-1 获取，作为药品字段提取的原始文本",
  "image_description": "从 WF-1 获取，辅助视觉理解",
  "authenticity_flags": "从 WF-1 获取，决定是否需要深度核验"
}
```

WF-2 需要额外调用 B 的药品知识库，对 WF-1 提取的药品信息做结构化解读和深度核验。
