'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { SafetyNotice } from '@/components/shared/safety-notice';
import { RiskBadge } from '@/components/shared/risk-badge';
import {
  loadCurrentMaterial,
  deriveRiskLevel,
  getMaterialTypeLabel,
  getNeedsConfirmation,
} from '@/lib/session-material';
import { displayField, displayArray } from '@/lib/workflows/flatten';
import { getAuthSession } from '@/lib/auth-session';
import { RISK_LEVEL_LABELS } from '@/lib/types';
import type { CitationField, Medicine, Source } from '@/lib/types';

const IDENTITY_STATUS_LABELS: Record<Medicine['identity_status'], string> = {
  confirmed: '已识别为药品',
  needs_confirmation: '需要确认药名',
  unclear: '识别不够清晰',
  multiple_candidates: '可能是多个药品',
};

const COMPACT_INPUT_CLASS = 'flex-1 min-h-9 rounded-lg border border-border bg-background px-3 py-1.5 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary';
const MISSING_MEDICINE_NOTICE = '未识别到相关信息，请仔细核对药品说明';

function finalNoticeItems(field: unknown): string[] {
  const items = displayArray(field);
  if (items.length > 0) return items;
  const text = displayField(field);
  return text ? [text] : [MISSING_MEDICINE_NOTICE];
}

function getSourceLabel(source: Source): string {
  const category = source.source_type === 'MANUAL_CONFIRMATION'
    ? '用户确认/系统提示'
    : source.source_type.startsWith('USER_')
      ? '上传材料'
      : '知识库/备案资料';
  return `${category} · ${source.short_name}${source.location ? `（${source.location}）` : ''}`;
}

function MedicineFieldSources({ label, field }: { label: string; field: unknown }) {
  const sources = field && typeof field === 'object' && 'sources' in field && Array.isArray(field.sources)
    ? field.sources as Source[]
    : [];
  return (
    <div className="border-t border-border py-3 first:border-t-0">
      <p className="text-base font-semibold text-foreground">{label}</p>
      {sources.length > 0 ? (
        <ul className="mt-1 space-y-1">
          {sources.map((source) => (
            <li key={`${source.source_id}-${source.location || ''}`} className="text-base text-muted-foreground">
              {getSourceLabel(source)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-base text-muted-foreground">
          {displayField(field) || displayArray(field).length > 0
            ? '来自上传内容的OCR识别结果，仅供参考，具体内容请以包装文字为准'
            : '暂无明确来源，请以材料原文和专业人员意见为准。'}
        </p>
      )}
    </div>
  );
}

interface MedicineDraft {
  drug_name: string;
  specification: string;
  approval_number: string;
  manufacturer: string;
  indication_from_instruction: string;
  dose_from_material: string;
  frequency_from_material: string;
  timing_from_material: string;
  important_warnings: string;
  contraindications: string;
  adverse_reactions: string;
  storage: string;
}

function createMedicineDraft(medicine: Medicine): MedicineDraft {
  return {
    drug_name: displayField(medicine.drug_name),
    specification: displayField(medicine.specification),
    approval_number: displayField(medicine.approval_number),
    manufacturer: displayField(medicine.manufacturer),
    indication_from_instruction: displayField(medicine.indication_from_instruction),
    dose_from_material: displayField(medicine.dose_from_material),
    frequency_from_material: displayField(medicine.frequency_from_material),
    timing_from_material: displayField(medicine.timing_from_material),
    important_warnings: displayArray(medicine.important_warnings).join('\n'),
    contraindications: displayArray(medicine.contraindications).join('\n'),
    adverse_reactions: displayArray(medicine.adverse_reactions).join('\n'),
    storage: displayField(medicine.storage),
  };
}

function updateStringCitation(
  field: CitationField<string>,
  value: string,
  materialId: string
): CitationField<string> {
  const trimmed = value.trim();
  const changed = displayField(field) !== trimmed;
  return {
    ...field,
    material_value: trimmed || null,
    display_value: trimmed || null,
    status: trimmed ? (changed ? 'confirmed' : field.status) : 'missing',
    sources: changed
      ? [...(field.sources || []), {
          source_id: `MANUAL-${materialId}`,
          source_type: 'MANUAL_CONFIRMATION',
          short_name: '由您在保存前确认或修改',
        }]
      : field.sources || [],
  };
}

function updateArrayCitation(
  field: CitationField<string[]>,
  value: string,
  materialId: string
): CitationField<string[]> {
  const values = value.split(/\r?\n|；|;/).map((item) => item.trim()).filter(Boolean);
  const changed = displayArray(field).join('\n') !== values.join('\n');
  return {
    ...field,
    material_value: values,
    display_value: values,
    status: values.length > 0 ? (changed ? 'confirmed' : field.status) : 'missing',
    sources: changed
      ? [...(field.sources || []), {
          source_id: `MANUAL-${materialId}`,
          source_type: 'MANUAL_CONFIRMATION',
          short_name: '由您在保存前确认或修改',
        }]
      : field.sources || [],
  };
}

function applyMedicineDraft(medicine: Medicine, draft: MedicineDraft, materialId: string): Medicine {
  return {
    ...medicine,
    identity_status: draft.drug_name.trim() ? 'confirmed' : 'unclear',
    drug_name: updateStringCitation(medicine.drug_name, draft.drug_name, materialId),
    specification: updateStringCitation(medicine.specification, draft.specification, materialId),
    approval_number: updateStringCitation(medicine.approval_number, draft.approval_number, materialId),
    manufacturer: updateStringCitation(medicine.manufacturer, draft.manufacturer, materialId),
    indication_from_instruction: updateStringCitation(medicine.indication_from_instruction, draft.indication_from_instruction, materialId),
    dose_from_material: updateStringCitation(medicine.dose_from_material, draft.dose_from_material, materialId),
    frequency_from_material: updateStringCitation(medicine.frequency_from_material, draft.frequency_from_material, materialId),
    timing_from_material: updateStringCitation(medicine.timing_from_material, draft.timing_from_material, materialId),
    important_warnings: updateArrayCitation(medicine.important_warnings, draft.important_warnings, materialId),
    contraindications: updateArrayCitation(medicine.contraindications, draft.contraindications, materialId),
    adverse_reactions: updateArrayCitation(medicine.adverse_reactions, draft.adverse_reactions, materialId),
    storage: updateStringCitation(medicine.storage, draft.storage, materialId),
  };
}

function mergeDoctorNoteCitation<T>(
  current: CitationField<T>,
  refreshed: CitationField<T>,
  materialId: string
): CitationField<T> {
  if (!displayField(refreshed) && displayArray(refreshed).length === 0) return current;
  const doctorSource: Source = {
    source_id: `DOCTOR-NOTE-${materialId}`,
    source_type: 'MANUAL_CONFIRMATION',
    short_name: '来自您输入的医生用药说明',
  };
  return {
    ...refreshed,
    sources: [...(current.sources || []).filter((source) => source.source_id !== doctorSource.source_id), doctorSource],
  };
}

function mergeMedicineWithDoctorNote(
  current: Medicine,
  refreshed: Medicine,
  note: string,
  materialId: string
): Medicine {
  const mentions = (pattern: RegExp) => pattern.test(note);
  const mentionsDrugName = mentions(/药名|药品名称|叫做/);
  return {
    ...current,
    identity_status: mentionsDrugName ? refreshed.identity_status : current.identity_status,
    drug_name: mentionsDrugName ? mergeDoctorNoteCitation(current.drug_name, refreshed.drug_name, materialId) : current.drug_name,
    specification: mentions(/规格|每片|每粒|每袋/)
      ? mergeDoctorNoteCitation(current.specification, refreshed.specification, materialId)
      : current.specification,
    approval_number: mentions(/批准文号|国药准字/)
      ? mergeDoctorNoteCitation(current.approval_number, refreshed.approval_number, materialId)
      : current.approval_number,
    manufacturer: mentions(/生产企业|厂家|制药/)
      ? mergeDoctorNoteCitation(current.manufacturer, refreshed.manufacturer, materialId)
      : current.manufacturer,
    indication_from_instruction: mentions(/适应症|用于|治疗/)
      ? mergeDoctorNoteCitation(current.indication_from_instruction, refreshed.indication_from_instruction, materialId)
      : current.indication_from_instruction,
    dose_from_material: mentions(/用量|剂量|一次|每次|[0-9一二三四五六七八九十]+(?:片|粒|袋|毫克|mg|毫升|ml)/i)
      ? mergeDoctorNoteCitation(current.dose_from_material, refreshed.dose_from_material, materialId)
      : current.dose_from_material,
    frequency_from_material: mentions(/频次|每天|每日|一日|每周|每隔|次\/日/)
      ? mergeDoctorNoteCitation(current.frequency_from_material, refreshed.frequency_from_material, materialId)
      : current.frequency_from_material,
    timing_from_material: mentions(/饭前|饭后|餐前|餐后|空腹|睡前|早上|早晨|中午|晚上|时间/)
      ? mergeDoctorNoteCitation(current.timing_from_material, refreshed.timing_from_material, materialId)
      : current.timing_from_material,
    important_warnings: mentions(/注意|提醒|避免|不能|不要|慎用|禁用/)
      ? mergeDoctorNoteCitation(current.important_warnings, refreshed.important_warnings, materialId)
      : current.important_warnings,
    contraindications: mentions(/禁忌|过敏|禁用/)
      ? mergeDoctorNoteCitation(current.contraindications, refreshed.contraindications, materialId)
      : current.contraindications,
    adverse_reactions: mentions(/不良反应|副作用|头晕|恶心|皮疹|腹泻/)
      ? mergeDoctorNoteCitation(current.adverse_reactions, refreshed.adverse_reactions, materialId)
      : current.adverse_reactions,
    storage: mentions(/储存|贮藏|保存|冷藏|避光|密封/)
      ? mergeDoctorNoteCitation(current.storage, refreshed.storage, materialId)
      : current.storage,
    needs_confirmation: refreshed.needs_confirmation,
    source_note: current.source_note.includes('医生用药说明仅更新其明确涉及的字段')
      ? current.source_note
      : `${current.source_note} 医生用药说明仅更新其明确涉及的字段。`,
  };
}

export default function MedicinePage() {
  const [material, setMaterial] = useState<import('@/lib/types').Material | null>(null);
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [medicineError, setMedicineError] = useState<string | null>(null);
  const [doctorDoseNote, setDoctorDoseNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const [isUpdatingNote, setIsUpdatingNote] = useState(false);
  const [medicineDraft, setMedicineDraft] = useState<MedicineDraft | null>(null);
  const [isResultSaved, setIsResultSaved] = useState(false);
  const [isSavingResult, setIsSavingResult] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const analysisRequestStarted = useRef(false);

  useEffect(() => {
    if (analysisRequestStarted.current) return;
    analysisRequestStarted.current = true;
    const loaded = loadCurrentMaterial();
    setMaterial(loaded);
    const savedDoctorDoseNote = loaded
      ? sessionStorage.getItem(`yinling_doctor_dose_note:${loaded.material_id}`) || ''
      : '';
    setDoctorDoseNote(savedDoctorDoseNote);

    if (!loaded) {
      setLoading(false);
      return;
    }

    const savedMedicine = sessionStorage.getItem(`yinling_saved_medicine:${loaded.material_id}`);
    if (savedMedicine) {
      try {
        const parsedMedicine = JSON.parse(savedMedicine) as Medicine;
        setMedicine(parsedMedicine);
        setMedicineDraft(createMedicineDraft(parsedMedicine));
        setIsResultSaved(true);
        setLoading(false);
        return;
      } catch {
        sessionStorage.removeItem(`yinling_saved_medicine:${loaded.material_id}`);
      }
    }

    fetch('/api/medicine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        material_json: loaded,
        user_dose_note: savedDoctorDoseNote || undefined,
      }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) {
          setMedicineError(json.error_message || '药品解读服务暂时不可用');
        } else {
          const analyzedMedicine = json.data as Medicine;
          setMedicineError(null);
          setMedicine(analyzedMedicine);
          setMedicineDraft(createMedicineDraft(analyzedMedicine));
        }
      })
      .catch(() => {
        setMedicineError('网络连接失败，请检查网络后重试。');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const persistMedicineRecord = async (nextMedicine: Medicine, nextDoctorDoseNote = '') => {
    if (!material) throw new Error('缺少材料');
    const session = getAuthSession();
    const operationContext = JSON.parse(
      sessionStorage.getItem('yinling_current_operation_context') || '{}'
    ) as { operator_user_id?: string; subject_user_id?: string };
    const userId = session?.user_id || operationContext.operator_user_id;
    const subjectUserId = operationContext.subject_user_id || session?.user_id;
    if (!userId || !subjectUserId) throw new Error('登录状态已失效');

    const response = await fetch('/api/medicine/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        subject_user_id: subjectUserId,
        material_json: material,
        medicine_json: nextMedicine,
        doctor_dose_note: nextDoctorDoseNote,
      }),
    });
    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.error_message || '药品记录保存失败');
    }
  };

  const handleSaveResult = async () => {
    if (!material || !medicine || !medicineDraft) return;
    setIsSavingResult(true);
    setMedicineError(null);
    setSaveMessage('');
    const updatedMedicine = applyMedicineDraft(medicine, medicineDraft, material.material_id);
    try {
      await persistMedicineRecord(updatedMedicine);
      setMedicine(updatedMedicine);
      sessionStorage.setItem(`yinling_saved_medicine:${material.material_id}`, JSON.stringify(updatedMedicine));
      setIsResultSaved(true);
      setSaveMessage('药品信息已保存，并已写入历史记录。');
    } catch (error) {
      setMedicineError(error instanceof Error ? error.message : '药品记录保存失败，请稍后重试。');
    } finally {
      setIsSavingResult(false);
    }
  };

  const handleDoctorDoseNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!material || !doctorDoseNote.trim()) return;

    setMedicineError(null);
    setNoteSaved(false);
    setIsUpdatingNote(true);
    try {
      const response = await fetch('/api/medicine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material_json: material,
          user_dose_note: doctorDoseNote.trim(),
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        setMedicineError(json.error_message || '医生说明暂时无法保存，请稍后重试。');
        return;
      }

      const refreshedMedicine = json.data as Medicine;
      const updatedMedicine = medicine
        ? mergeMedicineWithDoctorNote(medicine, refreshedMedicine, doctorDoseNote.trim(), material.material_id)
        : refreshedMedicine;
      await persistMedicineRecord(updatedMedicine, doctorDoseNote.trim());
      setMedicine(updatedMedicine);
      setMedicineDraft(createMedicineDraft(updatedMedicine));
      sessionStorage.setItem(`yinling_doctor_dose_note:${material.material_id}`, doctorDoseNote.trim());
      sessionStorage.setItem(`yinling_saved_medicine:${material.material_id}`, JSON.stringify(updatedMedicine));
      setNoteSaved(true);
    } catch {
      setMedicineError('网络连接失败，医生说明暂时无法保存。');
    } finally {
      setIsUpdatingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-lg text-muted-foreground">正在加载分析结果...</p>
      </div>
    );
  }

  if (!material) {
    return (
      <div>
        <PageHeader title="药品解读结果" backHref="/" backLabel="返回上一级" />
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 mb-6">
          <p className="text-red-700 text-base mb-4">
            <span aria-hidden="true">❌</span> 没有找到分析结果，请重新上传材料。
          </p>
          <Link
            href="/upload"
            className="inline-block bg-primary text-primary-foreground rounded-xl px-8 py-4 text-xl font-semibold hover:opacity-90 transition-opacity"
          >
            重新上传
          </Link>
          <Link
            href="/"
            className="mt-3 block bg-muted text-foreground rounded-xl px-8 py-4 text-xl font-semibold text-center hover:opacity-90 transition-opacity"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const riskLevel = deriveRiskLevel(material);
  const authVerification = material.authenticity_flags
    ? { reason: material.authenticity_flags.authenticity_level_label }
    : null;
  const materialConfirmationItems = getNeedsConfirmation(material);
  const medicineConfirmationItems = medicine?.needs_confirmation ?? [];
  const confirmationItems = medicineConfirmationItems.length > 0
    ? medicineConfirmationItems
    : materialConfirmationItems;
  const confidencePercent = Math.round(Math.max(0, Math.min(1, material.confidence > 1 ? material.confidence / 100 : material.confidence)) * 100);
  const isHighConfidence = confidencePercent >= 80;

  return (
    <div>
      <PageHeader title="药品解读结果" backHref="/" backLabel="返回上一级" />

      {!isResultSaved && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-base font-semibold text-amber-900" role="note">
          如果OCR识别有误，请在本页进行修改后点击保存
        </div>
      )}

      {/* 风险等级 */}
      <div className="bg-card border-2 border-border rounded-2xl p-6 mb-6 text-center">
        <h3 className="text-lg text-muted-foreground mb-3">当前风险等级</h3>
        <RiskBadge level={riskLevel} size="lg" />
        {authVerification && (
          <p className="text-base text-muted-foreground mt-3">
            {RISK_LEVEL_LABELS[riskLevel] || ''} — {displayField(authVerification.reason)}
          </p>
        )}
      </div>

      {/* 安全提示 - 固定显示 */}
      <SafetyNotice type="medical" className="mb-6" />

      {/* 材料类型 */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-2 text-muted-foreground text-base">
          <span>材料类型：</span>
          <span className="font-semibold text-foreground">
            {getMaterialTypeLabel(material.material_type)}
          </span>
        </div>
      </div>

      {/* 药品基本信息 */}
      {medicine && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-3">
          <h3 className="text-lg font-semibold text-foreground mb-3">💊 药品基本信息</h3>
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span className="text-muted-foreground text-base shrink-0 sm:w-28">识别状态：</span>
              <div className="flex-1">
                <span className={`text-base font-semibold ${isHighConfidence ? 'text-green-700' : 'text-red-700'}`}>
                  {IDENTITY_STATUS_LABELS[medicine.identity_status] || '需要您核对'} · 识别置信度 {confidencePercent}%
                </span>
                <div
                  className="mt-2 h-3 w-full overflow-hidden rounded-full bg-gray-200"
                  role="progressbar"
                  aria-label="药品识别置信度"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={confidencePercent}
                >
                  <div
                    className={`h-full rounded-full ${isHighConfidence ? 'bg-green-600' : 'bg-red-600'}`}
                    style={{ width: `${confidencePercent}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span className="text-muted-foreground text-base shrink-0 sm:w-28">药品名称：</span>
              {!isResultSaved && medicineDraft ? (
                <input
                  value={medicineDraft.drug_name}
                  onChange={(event) => setMedicineDraft({ ...medicineDraft, drug_name: event.target.value })}
                  placeholder="请输入药品名称"
                  className={`${COMPACT_INPUT_CLASS} font-semibold`}
                />
              ) : (
                <span className="text-foreground text-base font-semibold">{displayField(medicine.drug_name, '未识别')}</span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span className="text-muted-foreground text-base shrink-0 sm:w-28">规格：</span>
              {!isResultSaved && medicineDraft ? (
                <input
                  value={medicineDraft.specification}
                  onChange={(event) => setMedicineDraft({ ...medicineDraft, specification: event.target.value })}
                  placeholder="请输入规格"
                  className={COMPACT_INPUT_CLASS}
                />
              ) : (
                <span className="text-foreground text-base">{displayField(medicine.specification, '未识别')}</span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span className="text-muted-foreground text-base shrink-0 sm:w-28">批准文号：</span>
              {!isResultSaved && medicineDraft ? (
                <input
                  value={medicineDraft.approval_number}
                  onChange={(event) => setMedicineDraft({ ...medicineDraft, approval_number: event.target.value })}
                  placeholder="请输入批准文号"
                  className={COMPACT_INPUT_CLASS}
                />
              ) : (
                <span className="text-foreground text-base">{displayField(medicine.approval_number, '未识别')}</span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span className="text-muted-foreground text-base shrink-0 sm:w-28">生产企业：</span>
              {!isResultSaved && medicineDraft ? (
                <input
                  value={medicineDraft.manufacturer}
                  onChange={(event) => setMedicineDraft({ ...medicineDraft, manufacturer: event.target.value })}
                  placeholder="请输入生产企业"
                  className={COMPACT_INPUT_CLASS}
                />
              ) : (
                <span className="text-foreground text-base">{displayField(medicine.manufacturer, '未识别')}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 用法用量 */}
      {medicine && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-3">
          <h3 className="text-lg font-semibold text-foreground mb-3">🕐 用法用量</h3>
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span className="text-muted-foreground text-base shrink-0 sm:w-28">单次用量：</span>
              {!isResultSaved && medicineDraft ? (
                <input
                  value={medicineDraft.dose_from_material}
                  onChange={(event) => setMedicineDraft({ ...medicineDraft, dose_from_material: event.target.value })}
                  placeholder="请输入单次用量"
                  className={COMPACT_INPUT_CLASS}
                />
              ) : (
                <span className="text-foreground text-base">{displayField(medicine.dose_from_material, '未识别')}</span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span className="text-muted-foreground text-base shrink-0 sm:w-28">用药频次：</span>
              {!isResultSaved && medicineDraft ? (
                <input
                  value={medicineDraft.frequency_from_material}
                  onChange={(event) => setMedicineDraft({ ...medicineDraft, frequency_from_material: event.target.value })}
                  placeholder="请输入用药频次"
                  className={COMPACT_INPUT_CLASS}
                />
              ) : (
                <span className="text-foreground text-base">{displayField(medicine.frequency_from_material, '未识别')}</span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span className="text-muted-foreground text-base shrink-0 sm:w-28">用药时间：</span>
              {!isResultSaved && medicineDraft ? (
                <input
                  value={medicineDraft.timing_from_material}
                  onChange={(event) => setMedicineDraft({ ...medicineDraft, timing_from_material: event.target.value })}
                  placeholder="请输入用药时间"
                  className={COMPACT_INPUT_CLASS}
                />
              ) : (
                <span className="text-foreground text-base">{displayField(medicine.timing_from_material, '未识别')}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 医生用药说明 */}
      {isResultSaved && (
        <form onSubmit={handleDoctorDoseNoteSubmit} className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-3">
        <label htmlFor="doctor-dose-note" className="block text-lg font-semibold text-foreground mb-2">
          🩺 医生用药说明
        </label>
        <p className="text-base text-muted-foreground leading-relaxed mb-3">
          如果医生另有交代，请在这里输入。系统会结合材料重新整理，但不会替代医生或药师判断。
        </p>
        <textarea
          id="doctor-dose-note"
          value={doctorDoseNote}
          onChange={(e) => {
            setDoctorDoseNote(e.target.value);
            setNoteSaved(false);
          }}
          rows={1}
          maxLength={500}
          placeholder="例如：医生说每天早饭后服用一片"
          className="w-full min-h-9 resize-y rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            type="submit"
            disabled={!doctorDoseNote.trim() || isUpdatingNote}
            className="bg-primary text-primary-foreground rounded-xl px-6 py-3 text-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {isUpdatingNote ? '正在重新整理……' : '保存并重新整理说明'}
          </button>
          {noteSaved && (
            <p className="text-base font-semibold text-green-700" role="status">
              已记录医生说明，并更新整理结果。
            </p>
          )}
        </div>
        </form>
      )}

      {/* 适应症 */}
      {medicine && (displayField(medicine.indication_from_instruction) || !isResultSaved) && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-3">
          <h3 className="text-lg font-semibold text-foreground mb-2">📋 适应症</h3>
          {!isResultSaved && medicineDraft ? (
            <textarea
              value={medicineDraft.indication_from_instruction}
              onChange={(event) => setMedicineDraft({ ...medicineDraft, indication_from_instruction: event.target.value })}
              rows={1}
              placeholder="请输入适应症"
              className={`${COMPACT_INPUT_CLASS} w-full resize-y`}
            />
          ) : (
            <p className="text-base text-foreground leading-relaxed">
              {displayField(medicine.indication_from_instruction)}
            </p>
          )}
        </div>
      )}

      {/* 重要提醒 / 禁忌 / 不良反应 / 储存 */}
      {medicine && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-3">
          <h3 className="text-lg font-semibold text-foreground mb-3">⚠️ 重要提醒</h3>
          <div className="space-y-2">
            {!isResultSaved && medicineDraft ? (
              <>
                <label className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                  <span className="text-base font-semibold text-foreground shrink-0 sm:w-44">重要提醒（分号分隔）</span>
                  <textarea
                    value={medicineDraft.important_warnings}
                    onChange={(event) => setMedicineDraft({ ...medicineDraft, important_warnings: event.target.value })}
                    rows={1}
                    placeholder="请输入重要提醒"
                    className={`${COMPACT_INPUT_CLASS} w-full resize-y`}
                  />
                </label>
                <label className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                  <span className="text-base font-semibold text-foreground shrink-0 sm:w-44">禁忌（分号分隔）</span>
                  <textarea
                    value={medicineDraft.contraindications}
                    onChange={(event) => setMedicineDraft({ ...medicineDraft, contraindications: event.target.value })}
                    rows={1}
                    placeholder="请输入禁忌"
                    className={`${COMPACT_INPUT_CLASS} w-full resize-y`}
                  />
                </label>
                <label className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                  <span className="text-base font-semibold text-foreground shrink-0 sm:w-44">不良反应（分号分隔）</span>
                  <textarea
                    value={medicineDraft.adverse_reactions}
                    onChange={(event) => setMedicineDraft({ ...medicineDraft, adverse_reactions: event.target.value })}
                    rows={1}
                    placeholder="请输入常见不良反应"
                    className={`${COMPACT_INPUT_CLASS} w-full resize-y`}
                  />
                </label>
                <label className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                  <span className="text-base font-semibold text-foreground shrink-0 sm:w-44">储存要求</span>
                  <input
                    value={medicineDraft.storage}
                    onChange={(event) => setMedicineDraft({ ...medicineDraft, storage: event.target.value })}
                    placeholder="请输入储存要求"
                    className={`${COMPACT_INPUT_CLASS} w-full`}
                  />
                </label>
              </>
            ) : (
              <>
              <div>
                <h4 className="text-base font-semibold text-foreground mb-2">适用人群/用途</h4>
                <p className="text-base text-foreground leading-relaxed">
                  {displayField(medicine.indication_from_instruction, MISSING_MEDICINE_NOTICE)}
                </p>
              </div>
              <div>
                <h4 className="text-base font-semibold text-foreground mb-2">重要提醒</h4>
                <ul className="list-disc list-inside space-y-1">
                  {finalNoticeItems(medicine.important_warnings).map((item, i) => (
                    <li key={i} className="text-base text-foreground leading-relaxed">{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-base font-semibold text-foreground mb-2">禁忌</h4>
                <ul className="list-disc list-inside space-y-1">
                  {finalNoticeItems(medicine.contraindications).map((item, i) => (
                    <li key={i} className="text-base text-foreground leading-relaxed">{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-base font-semibold text-foreground mb-2">常见不良反应</h4>
                <ul className="list-disc list-inside space-y-1">
                  {finalNoticeItems(medicine.adverse_reactions).map((item, i) => (
                    <li key={i} className="text-base text-foreground leading-relaxed">{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-base font-semibold text-foreground mb-2">储存要求</h4>
                <p className="text-base text-foreground leading-relaxed">
                  {displayField(medicine.storage, MISSING_MEDICINE_NOTICE)}
                </p>
              </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 药品真实性核验 */}
      {material.authenticity_flags && material.authenticity_flags.authenticity_level !== 'not_applicable' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-4">
          <h3 className="text-xl font-bold text-amber-800 mb-4">🔍 药品真实性核验</h3>
          <p className="text-base text-amber-900 mb-2">
            核验结果：{material.authenticity_flags.authenticity_level_label}
          </p>
          {material.authenticity_flags.risk_signals.length > 0 && (
            <ul className="mb-2 space-y-1">
              {material.authenticity_flags.risk_signals.map((signal, i) => (
                <li key={i} className="text-base text-amber-900 leading-relaxed">
                  • {signal}
                </li>
              ))}
            </ul>
          )}
          {material.authenticity_flags.verification_suggestions.length > 0 && (
            <ul className="space-y-1">
              {material.authenticity_flags.verification_suggestions.map((suggestion, i) => (
                <li key={i} className="text-base text-amber-800 leading-relaxed">
                  💡 {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 解读失败提示 */}
      {medicineError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-4">
          <h3 className="text-lg font-bold text-red-700 mb-2">{medicine ? '操作未能完成' : '药品解读未能完成'}</h3>
          <p className="text-base text-red-700 leading-relaxed">{medicineError}</p>
        </div>
      )}

      {/* 需要确认的问题 */}
      {confirmationItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-4">
          <h3 className="text-xl font-bold text-amber-800 mb-4">❓ 需要确认的问题</h3>
          <ul className="space-y-2">
            {confirmationItems.map((question, i) => (
              <li key={i} className="flex items-start gap-2 text-base text-amber-900 leading-relaxed">
                {confirmationItems.length > 1 && <span className="shrink-0">{i + 1}.</span>}
                {question}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* OCR 原文 */}
      <details className="bg-muted/50 border border-border rounded-2xl p-5 mb-4">
        <summary className="text-lg font-semibold text-foreground cursor-pointer">
          📝 查看识别到的原始文字
        </summary>
        <div className="max-h-60 overflow-y-auto rounded-lg bg-white/50 p-3">
          <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap">
            {material.ocr_text || '（未识别到文字）'}
          </p>
        </div>
        <p className="text-base text-muted-foreground mt-2">
          图片识别可能受反光、折叠和字体影响，请以药盒、处方和说明书原文为准。
        </p>
      </details>

      {/* 数据来源说明 */}
      {medicine && (
        <div className="bg-muted/50 border border-border rounded-2xl p-5 mb-4">
          <h3 className="text-lg font-semibold text-foreground mb-3">📚 数据来源说明</h3>
          {medicine.source_note && (
            <p className="text-base text-muted-foreground leading-relaxed">
              {medicine.source_note}
            </p>
          )}
          <details className={`${medicine.source_note ? 'mt-4 border-t border-border pt-4' : ''}`}>
            <summary className="text-lg font-semibold text-foreground cursor-pointer">
              🔎 查看逐项信息来源
            </summary>
            <div className="mt-3">
              <MedicineFieldSources label="药品名称" field={medicine.drug_name} />
              <MedicineFieldSources label="规格" field={medicine.specification} />
              <MedicineFieldSources label="批准文号" field={medicine.approval_number} />
              <MedicineFieldSources label="生产企业" field={medicine.manufacturer} />
              <MedicineFieldSources label="适应症" field={medicine.indication_from_instruction} />
              <MedicineFieldSources label="单次用量" field={medicine.dose_from_material} />
              <MedicineFieldSources label="用药频次" field={medicine.frequency_from_material} />
              <MedicineFieldSources label="用药时间" field={medicine.timing_from_material} />
              <MedicineFieldSources label="重要提醒" field={medicine.important_warnings} />
              <MedicineFieldSources label="禁忌" field={medicine.contraindications} />
              <MedicineFieldSources label="常见不良反应" field={medicine.adverse_reactions} />
              <MedicineFieldSources label="储存要求" field={medicine.storage} />
            </div>
          </details>
        </div>
      )}

      {/* 操作按钮 */}
      {!isResultSaved ? (
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/upload"
            className="flex-1 bg-muted text-foreground rounded-xl px-8 py-4 text-xl font-semibold text-center hover:opacity-90 transition-opacity"
          >
            重新上传
          </Link>
          <button
            type="button"
            onClick={handleSaveResult}
            disabled={!medicine || !medicineDraft || isSavingResult}
            className="flex-1 bg-primary text-primary-foreground rounded-xl px-8 py-4 text-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {isSavingResult ? '正在保存……' : '保存药品信息'}
          </button>
          <Link
            href="/"
            onClick={(event) => {
              if (!window.confirm('是否返回首页？\n系统将不会保留未上传的图片或未保存的分析结果')) event.preventDefault();
            }}
            className="flex-1 bg-muted text-foreground rounded-xl px-8 py-4 text-xl font-semibold text-center hover:opacity-90 transition-opacity"
          >
            返回首页
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {saveMessage && (
            <p className="rounded-xl bg-green-50 p-4 text-center text-base font-semibold text-green-700" role="status">
              {saveMessage}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/doctor-questions"
            className="flex-1 bg-primary text-primary-foreground rounded-xl px-8 py-4 text-xl font-semibold text-center hover:opacity-90 transition-opacity"
          >
            生成问医生清单
          </Link>
          <Link
            href="/family"
            className="flex-1 bg-secondary text-secondary-foreground rounded-xl px-8 py-4 text-xl font-semibold text-center hover:opacity-90 transition-opacity"
          >
            生成家属简报
          </Link>
          <Link
            href="/"
            className="flex-1 bg-muted text-foreground rounded-xl px-8 py-4 text-xl font-semibold text-center hover:opacity-90 transition-opacity"
          >
            返回首页
          </Link>
        </div>
      </div>
      )}
    </div>
  );
}
