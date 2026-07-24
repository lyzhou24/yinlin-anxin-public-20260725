import type { AlertEvent, FamilyBrief, Material, Medicine, Risk } from './types';
import { deriveRiskLevel, getMaterialTypeLabel } from './session-material';
import { displayArray, displayField } from './workflows/flatten';

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function shortText(value: string, length = 120): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > length ? `${normalized.slice(0, length)}……` : normalized;
}

function detectPayment(text: string): FamilyBrief['payment_status'] {
  if (/已付款|已支付|已转账|付款成功/.test(text)) return 'paid';
  if (/未付款|没有付款|尚未支付/.test(text)) return 'not_paid';
  return 'unknown';
}

export function buildFamilyBriefFromAlert(alert: AlertEvent, elderName: string): FamilyBrief {
  const evidenceText = alert.evidence.map((item) => item.quote).join(' ');
  const riskLabels: Record<string, string> = {
    transaction: '交易或付款风险',
    claim: '夸大宣传或功效承诺',
    emotion: '情绪施压',
    personal_info: '个人信息风险',
  };
  const riskSummary = unique(alert.risk_categories.map((category) => riskLabels[category] || category));
  const exposed = unique([
    /身份证/.test(evidenceText) ? '身份证信息' : '',
    /银行卡|银行账户/.test(evidenceText) ? '银行卡或账户信息' : '',
    /验证码/.test(evidenceText) ? '验证码' : '',
    /手机号|联系电话/.test(evidenceText) ? '手机号' : '',
  ]);

  return {
    material_summary: `${elderName}的材料触发了${alert.risk_level === 'red' ? '红色' : '风险'}预警，主要涉及${riskSummary.join('、') || '需要家人共同核实的风险内容'}。`,
    product_or_person: riskSummary.join('、') || '预警相关内容',
    salesperson_or_org: '预警内容中的联系人或销售方（身份待核实）',
    upload_time: alert.created_at,
    payment_status: /已付款|已支付|已转账|付款成功/.test(evidenceText) ? 'paid' : 'unknown',
    payment_amount: '预警中未确认',
    stop_medicine_request: /停药|停止服药|停掉原来的药/.test(evidenceText),
    personal_data_exposed: exposed,
    highest_risk: alert.risk_level,
    risk_categories: alert.risk_categories,
    key_evidence: alert.evidence.map((item) => `${item.quote}（${item.source}）`),
    next_actions: alert.stop_actions,
    doctor_questions_count: 0,
  };
}

export function buildFamilyBriefFromAnalysis(
  material: Material,
  medicine: Medicine | null,
  risk: Risk | null
): FamilyBrief {
  const materialType = getMaterialTypeLabel(material.material_type);
  const medicineName = medicine ? displayField(medicine.drug_name) : '';
  const analysisText = [
    material.ocr_text,
    material.image_description,
    ...(risk?.signals.map((signal) => `${displayField(signal.evidence_text)} ${displayField(signal.reason)} ${displayField(signal.stop_action)}`) || []),
  ].join(' ');
  const riskEvidence = risk?.signals.map((signal) => displayField(signal.evidence_text)).filter(Boolean) || [];
  const medicineEvidence = medicine
    ? unique([
        ...displayArray(medicine.important_warnings),
        ...displayArray(medicine.contraindications),
        ...displayArray(medicine.adverse_reactions),
      ])
    : [];
  const keyEvidence = unique([
    ...riskEvidence,
    ...medicineEvidence,
    shortText(material.ocr_text),
  ]).slice(0, 8);
  const riskActions = risk
    ? unique([
        ...risk.signals.map((signal) => displayField(signal.stop_action)),
        ...displayArray(risk.verification_steps),
      ])
    : [];
  const medicineActions = medicine
    ? unique([
        medicineName ? `核对药品名称“${medicineName}”和包装上的批准文号。` : '',
        displayField(medicine.dose_from_material)
          ? `按医嘱核对用法用量：${displayField(medicine.dose_from_material)}，${displayField(medicine.frequency_from_material, '频次未识别')}。`
          : '用法用量未识别清楚，请携带原包装咨询医生或药师。',
        '不要仅凭识别结果自行增减或停用药物。',
      ])
    : [];
  const nextActions = unique([...riskActions, ...medicineActions]);
  const amountMatch = analysisText.match(/(?:￥|¥|人民币)?\s*(\d+(?:\.\d{1,2})?)\s*元/);
  const exposed = unique([
    /身份证/.test(analysisText) ? '身份证信息' : '',
    /银行卡|银行账户/.test(analysisText) ? '银行卡或账户信息' : '',
    /验证码/.test(analysisText) ? '验证码' : '',
    /手机号|联系电话/.test(analysisText) ? '手机号' : '',
  ]);

  return {
    material_summary: medicineName
      ? `老人上传了${materialType}，系统识别涉及药品“${medicineName}”。`
      : `老人上传了${materialType}，识别摘要：${shortText(material.image_description || material.ocr_text || '材料中未识别到可用文字')}`,
    material_type: material.material_type,
    product_or_person: medicineName || shortText(material.image_description || material.ocr_text || '暂未确认', 80),
    salesperson_or_org: /销售|客服|老师|经理|公司|机构/.test(analysisText)
      ? shortText(material.image_description || material.ocr_text, 80)
      : undefined,
    payment_status: detectPayment(analysisText),
    payment_amount: amountMatch ? `${amountMatch[1]}元` : '暂未确认',
    stop_medicine_request: /停药|停止服药|不用再吃药/.test(analysisText),
    personal_data_exposed: exposed,
    highest_risk: risk?.risk_level ?? deriveRiskLevel(material),
    risk_categories: risk ? unique(risk.signals.map((signal) => String(signal.category))) : [],
    key_evidence: keyEvidence.length > 0 ? keyEvidence : ['当前材料未提取到可展示的原文证据，请核对上传材料。'],
    next_actions: (nextActions.length > 0
      ? nextActions
      : ['请家人共同核对上传材料原文和产品信息。', '涉及用药时请咨询医生或药师，不要自行调整用药。']
    ).slice(0, 8),
    doctor_questions_count: medicine?.needs_confirmation.length ?? 0,
    material_image: material.file_url || undefined,
  };
}
