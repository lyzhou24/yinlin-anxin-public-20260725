/** 银龄安心 - 核心数据类型定义 */

// ===== 材料相关 =====

/** 材料类型枚举 */
export type MaterialType =
  | 'regular_medicine'       // 正规药品
  | 'medicine_leaflet'       // 药品说明书
  | 'hospital_prescription'  // 医院处方
  | 'multiple_medicines'     // 多种药品
  | 'health_supplement'      // 保健食品
  | 'ordinary_food'          // 普通食品
  | 'medical_device'         // 医疗器械
  | 'health_promotion'       // 健康宣传材料
  | 'sales_chat'             // 推销聊天记录
  | 'payment_proof'          // 订单或付款凭证
  | 'unknown';               // 暂时无法判断

/** 材料类型中文标签映射 */
export const MATERIAL_TYPE_LABELS: Record<MaterialType, string> = {
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

/** 图片质量 */
export type ImageQuality = 'good' | 'fair' | 'poor';

/** 分析路由 */
export type AnalysisRoute = 'medicine' | 'fraud' | 'compare' | 'evidence' | 'multi_medicine' | 'manual_confirm';

/** 来源类型 */
export type SourceType =
  | 'USER_PACKAGE'
  | 'USER_INSTRUCTION'
  | 'USER_PRESCRIPTION'
  | 'USER_MEDICATION_LIST'
  | 'MEDICAL_INSURANCE_CATALOG'
  | 'ESSENTIAL_MEDICINES_LIST'
  | 'NMPA_REFERENCE'
  | 'MANUAL_CONFIRMATION';

/** 来源对象 */
export interface Source {
  source_id: string;
  source_type: SourceType;
  short_name: string;
  location?: string;
}

/** 引用字段状态 */
export type CitationStatus =
  | 'confirmed'
  | 'material_only'
  | 'catalog_only'
  | 'conflict'
  | 'unclear'
  | 'missing';

/** 引用字段对象 */
export interface CitationField<T = string> {
  material_value?: T | null;
  catalog_value?: T | null;
  display_value?: T | null;
  status: CitationStatus;
  sources: Source[];
  missing_message?: string;
}

/** 药品真实性风险初筛结果 */
export interface AuthenticityFlags {
  authenticity_level: 'likely_authentic' | 'needs_verification' | 'suspected_counterfeit' | 'not_applicable';
  authenticity_level_label: string;
  risk_signals: string[];
  verification_suggestions: string[];
}

/** 置信度等级 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/** 材料对象（v2 - 含仿冒药判断和隐私检测） */
export interface Material {
  material_id: string;
  file_url: string;
  material_type: MaterialType;
  type_label: string;
  confidence: number;       // 0-1
  confidence_level: ConfidenceLevel;
  quality: ImageQuality;
  ocr_text: string;
  image_description: string;
  missing_fields: string[];
  route: AnalysisRoute;
  classification_reason?: string;
  authenticity_flags?: AuthenticityFlags | null;
}

// ===== 药品相关 =====

/** 药品身份核对状态 */
export type IdentityStatus = 'confirmed' | 'needs_confirmation' | 'unclear' | 'multiple_candidates';

/** 药品对象（v2 - 对齐 WF-2 实际输出） */
export interface Medicine {
  medicine_id: string;
  identity_status: IdentityStatus;
  drug_name: CitationField<string>;
  specification: CitationField<string>;
  approval_number: CitationField<string>;
  manufacturer: CitationField<string>;
  indication_from_instruction: CitationField<string>;
  dose_from_material: CitationField<string>;
  frequency_from_material: CitationField<string>;
  timing_from_material: CitationField<string>;
  important_warnings: CitationField<string[]>;
  contraindications: CitationField<string[]>;
  adverse_reactions: CitationField<string[]>;
  storage: CitationField<string>;
  needs_confirmation: string[];
  source_note: string;
}

/** 药品解读结果 */
export interface MedicineResult {
  risk_level: RiskLevel;
  medicine: Medicine;
}

/** 药品警告项（WF-2 返回 {text, source} 结构，扁平后为 string） */
export type MedicineWarning = string;

// ===== 风险相关 =====

/** 风险等级 */
export type RiskLevel = 'green' | 'yellow' | 'red';

/** 风险等级中文标签 */
export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  green: '暂未发现明显风险',
  yellow: '有些信息需要核实',
  red: '请先停一下',
};

/** 风险信号类别 */
export type SignalCategory = 'identity' | 'claim' | 'transaction' | 'emotion' | 'product_authenticity' | string;

/** 风险信号分类中文标签 */
export const SIGNAL_CATEGORY_LABELS: Record<SignalCategory, string> = {
  identity: '身份风险',
  claim: '宣传风险',
  transaction: '交易风险',
  emotion: '情绪操控风险',
  product_authenticity: '产品真实性风险',
};

/** 风险信号来源信息（WF-3 material_sources / knowledge_sources） */
export interface RiskSignalSource {
  source_id?: string;
  source_type?: string;
  short_name?: string;
  location?: string;
}

/** 风险信号 */
export interface RiskSignal {
  category: SignalCategory;
  evidence_text: string;
  reason: string;
  stop_action: string;
  material_sources?: RiskSignalSource[] | string[];
  knowledge_sources?: RiskSignalSource[] | string[];
}

/** 风险对象（v2 - 对齐 WF-3 输出） */
export interface Risk {
  risk_level: RiskLevel;
  signals: RiskSignal[];
  verification_steps: string[];
  evidence_to_keep: string[];
}

// ===== 家属简报 =====

/** 付款状态 */
export type PaymentStatus = 'unknown' | 'not_paid' | 'paid';

/** 家属简报对象 */
export interface FamilyBrief {
  material_summary: string;
  material_type?: MaterialType;
  product_or_person: string;
  salesperson_or_org?: string;
  upload_time?: string;
  payment_status: PaymentStatus;
  payment_amount: string;
  payment_account?: string;
  stop_medicine_request: boolean;
  personal_data_exposed: string[];
  highest_risk: RiskLevel;
  risk_categories?: string[];
  key_evidence: string[];
  next_actions: string[];
  doctor_questions_count?: number;
  material_image?: string;
}

// ===== 问医生清单 =====

/** 问题优先级 */
export type QuestionPriority = 'high' | 'medium' | 'low';

/** 问医生问题 */
export interface DoctorQuestion {
  priority: QuestionPriority;
  text: string;
  background: string;
  related_materials: string[];
  uncertain_fields: string[];
}

/** 问医生清单 */
export interface DoctorQuestionList {
  priority_questions: string[];
  medicine_questions: string[];
  supplement_questions: string[];
  bring_materials: string[];
}

// ===== 证据整理 =====

/** 证据时间线条目 */
export interface TimelineEvent {
  date: string;
  event: string;
}

/** 证据条目 */
export interface EvidenceItem {
  timeline: TimelineEvent[];
  seller: string;
  product_name: string;
  payment_amount: string;
  payment_account: string;
  promise: string;
  refund_rule: string;
  saved_evidence: string[];
  missing_evidence: string[];
  complaint_materials: string[];
}

// ===== 对照 =====

/** 对照产品 */
export interface ComparisonProduct {
  category: string;
  source: string;
  approval_number: string;
  verification_status: string;
  manufacturer: string;
  specification: string;
  induce_substitution: string;
  channel: string;
  payment: string;
}

/** 对照结果 */
export interface ComparisonResult {
  medicine: ComparisonProduct;
  product: ComparisonProduct;
  key_differences: { level: 'red' | 'yellow' | 'green'; text: string }[];
  suggestions: { medicine: string; product: string };
}

// ===== 错误 =====

/** 错误对象 */
export interface AppError {
  code: string;
  message_for_user: string;
  retry_action: string;
}

/** 预定义错误类型 */
export type ErrorCode =
  | 'unsupported_format'
  | 'file_too_large'
  | 'image_blurry'
  | 'ocr_failed'
  | 'type_uncertain'
  | 'ai_failed'
  | 'network_error'
  | 'approval_number_not_found'
  | 'approval_number_mismatch'
  | 'qrcode_only'
  | 'save_failed'
  | 'delete_failed';

/** 错误码信息映射 */
export const ERROR_CODE_INFO: Record<ErrorCode, { message: string; retry: string }> = {
  unsupported_format: {
    message: '请上传 JPG 或 PNG 格式的照片。',
    retry: '重新上传',
  },
  file_too_large: {
    message: '图片太大，请换一张或缩小后重试。',
    retry: '重新上传',
  },
  image_blurry: {
    message: '图片有些模糊，请在光线明亮的地方重拍。',
    retry: '重新拍照',
  },
  ocr_failed: {
    message: '没有看清图片中的文字，请重新拍摄。',
    retry: '重新拍照',
  },
  type_uncertain: {
    message: '暂时不能确定这是什么材料，请选择类别。',
    retry: '选择材料类别',
  },
  ai_failed: {
    message: '分析时间有些长，请重新试一次。',
    retry: '重新分析',
  },
  network_error: {
    message: '网络连接失败，请检查网络后重试。',
    retry: '重新加载',
  },
  approval_number_not_found: {
    message: '未找到批准文号，无法验证药品真实性。',
    retry: '重新上传',
  },
  approval_number_mismatch: {
    message: '批准文号与药品信息不匹配，可能存在风险。',
    retry: '重新上传',
  },
  qrcode_only: {
    message: '仅识别到二维码，无法进行完整分析，请上传更完整的材料。',
    retry: '重新上传',
  },
  save_failed: {
    message: '这次没有保存成功，请稍后重试。',
    retry: '重新保存',
  },
  delete_failed: {
    message: '这次没有删除成功，请稍后重试。',
    retry: '重新试一次',
  },
};

// ===== 账户与家庭 =====

/** 用户角色 */
export type UserRole = 'elder' | 'family';

/** 用户角色中文标签 */
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  elder: '老人本人',
  family: '家属/照护者',
};

/** 用户账户 */
export interface UserAccount {
  user_id: string;
  username: string;
  phone: string;
  login_type: 'sms' | 'test_account';
  account_status: 'active' | 'disabled';
  created_at: string;
  last_login_at: string;
}

/** 用户资料 */
export interface UserProfile {
  user_id: string;
  user_role: UserRole;
  display_name?: string;
  birth_year?: number;
  has_chronic_disease?: boolean;
  chronic_diseases?: string;
  profile_completed: boolean;
  allow_family_binding: boolean;
}

/** 家庭关系类型 */
export type RelationType = 'child' | 'spouse' | 'relative' | 'caregiver' | 'other';

/** 家庭关系类型中文标签 */
export const RELATION_TYPE_LABELS: Record<RelationType, string> = {
  child: '子女',
  spouse: '配偶',
  relative: '其他亲属',
  caregiver: '照护者',
  other: '其他',
};

/** 家庭关系权限 */
export interface FamilyPermissions {
  receive_red_alert: boolean;
  view_family_report: boolean;
  upload_for_elder: boolean;
  view_history_summary: boolean;
  view_original_image: boolean;
  view_financial_details: boolean;
}

/** 家庭关系 */
export interface FamilyRelation {
  relation_id: string;
  elder_user_id: string;
  family_user_id: string;
  relation_type: RelationType;
  status: 'pending' | 'active' | 'rejected' | 'revoked';
  permissions: FamilyPermissions;
  requested_at: string;
  confirmed_at?: string;
  revoked_at?: string;
}

/** 家庭绑定码 */
export interface FamilyInvite {
  invite_id: string;
  elder_user_id: string;
  invite_code: string;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  expires_at: string;
  used_by_user_id?: string;
  created_at: string;
}

/** 操作上下文 */
export interface OperationContext {
  operator_user_id: string;
  subject_user_id: string;
  operator_role: UserRole;
  relation_id?: string;
  operation_type: 'upload' | 'view_report' | 'view_history' | 'view_alert';
  permission_checked: boolean;
}

// ===== 预警通知 =====

/** 预警事件状态 */
export type AlertStatus =
  | 'created'
  | 'no_recipient'
  | 'notifying'
  | 'notified'
  | 'partially_failed'
  | 'closed';

/** 预警证据 */
export interface AlertEvidence {
  quote: string;
  source: string;
}

/** 预警事件 */
export interface AlertEvent {
  alert_id: string;
  subject_user_id: string;
  material_id: string;
  analysis_id: string;
  family_report_id?: string;
  risk_level: RiskLevel;
  risk_categories: string[];
  evidence: AlertEvidence[];
  stop_actions: string[];
  status: AlertStatus;
  created_at: string;
}

/** 通知记录状态 */
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'read' | 'acknowledged';

/** 通知记录 */
export interface NotificationRecord {
  notification_id: string;
  alert_id: string;
  recipient_user_id: string;
  channel: 'in_app';
  status: NotificationStatus;
  sent_at?: string;
  read_at?: string;
  acknowledged_at?: string;
  failure_reason?: string;
  retry_count: number;
}

/** 登录会话 */
export interface UserSession {
  session_id: string;
  user_id: string;
  expires_at: string;
  status: 'active' | 'expired' | 'revoked';
  created_at: string;
}

// ===== 历史记录 =====

/** 历史记录条目 */
export interface HistoryRecord {
  id: string;
  subject_user_id?: string;
  material_type: MaterialType;
  risk_level: RiskLevel | null;
  analyzed_at: string;
  summary: string;
  thumbnail: string;
  status: 'confirmed' | 'pending' | 'analyzing';
  detail_sections?: Array<{
    title: string;
    items: string[];
  }>;
}
