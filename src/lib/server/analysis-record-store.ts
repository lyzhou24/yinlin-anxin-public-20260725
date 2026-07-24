import 'server-only';
import { randomUUID } from 'crypto';
import { getPool } from 'coze-coding-dev-sdk';
import type { FamilyBrief, HistoryRecord, Material, Medicine } from '@/lib/types';

export interface StoredMedicineRecord {
  record_id: string;
  user_id: string;
  subject_user_id: string;
  material: Material;
  medicine: Medicine;
  doctor_dose_note: string;
  created_at: string;
  updated_at: string;
}

export interface StoredFamilyShare {
  token: string;
  brief: FamilyBrief;
  created_at: string;
  expires_at: string;
}

const globalAnalysisStore = globalThis as typeof globalThis & {
  yinlingMedicineRecords?: Map<string, StoredMedicineRecord>;
  yinlingFamilyShares?: Map<string, StoredFamilyShare>;
};

const medicineRecords = globalAnalysisStore.yinlingMedicineRecords ?? new Map<string, StoredMedicineRecord>();
const familyShares = globalAnalysisStore.yinlingFamilyShares ?? new Map<string, StoredFamilyShare>();

globalAnalysisStore.yinlingMedicineRecords = medicineRecords;
globalAnalysisStore.yinlingFamilyShares = familyShares;

function hasDatabase(): boolean {
  return Boolean(process.env.PGDATABASE_URL);
}

async function ensureTables(): Promise<void> {
  const pool = await getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS yinling_medicine_records (
      material_id TEXT PRIMARY KEY,
      record_id TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      subject_user_id TEXT NOT NULL,
      material_json JSONB NOT NULL,
      medicine_json JSONB NOT NULL,
      doctor_dose_note TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS yinling_family_shares (
      token TEXT PRIMARY KEY,
      brief_json JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL
    )
  `);
}

export async function saveMedicineRecord(input: {
  user_id: string;
  subject_user_id: string;
  material: Material;
  medicine: Medicine;
  doctor_dose_note?: string;
}): Promise<StoredMedicineRecord> {
  const existing = medicineRecords.get(input.material.material_id);
  const now = new Date().toISOString();
  const record: StoredMedicineRecord = {
    record_id: existing?.record_id ?? `medrec_${randomUUID()}`,
    user_id: input.user_id,
    subject_user_id: input.subject_user_id,
    material: input.material,
    medicine: input.medicine,
    doctor_dose_note: input.doctor_dose_note?.trim() ?? existing?.doctor_dose_note ?? '',
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };

  if (hasDatabase()) {
    await ensureTables();
    const pool = await getPool();
    await pool.query(
      `INSERT INTO yinling_medicine_records (
        material_id, record_id, user_id, subject_user_id, material_json, medicine_json,
        doctor_dose_note, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8,$9)
      ON CONFLICT (material_id) DO UPDATE SET
        record_id = EXCLUDED.record_id,
        user_id = EXCLUDED.user_id,
        subject_user_id = EXCLUDED.subject_user_id,
        material_json = EXCLUDED.material_json,
        medicine_json = EXCLUDED.medicine_json,
        doctor_dose_note = EXCLUDED.doctor_dose_note,
        updated_at = EXCLUDED.updated_at`,
      [
        input.material.material_id,
        record.record_id,
        record.user_id,
        record.subject_user_id,
        JSON.stringify(record.material),
        JSON.stringify(record.medicine),
        record.doctor_dose_note,
        record.created_at,
        record.updated_at,
      ]
    );
  } else {
    medicineRecords.set(input.material.material_id, record);
  }

  return record;
}

export async function listMedicineRecords(): Promise<StoredMedicineRecord[]> {
  if (hasDatabase()) {
    await ensureTables();
    const pool = await getPool();
    const result = await pool.query<{
      record_id: string;
      user_id: string;
      subject_user_id: string;
      material_json: Material;
      medicine_json: Medicine;
      doctor_dose_note: string;
      created_at: Date;
      updated_at: Date;
    }>(`SELECT * FROM yinling_medicine_records ORDER BY updated_at DESC`);
    return result.rows.map((row) => ({
      record_id: row.record_id,
      user_id: row.user_id,
      subject_user_id: row.subject_user_id,
      material: row.material_json,
      medicine: row.medicine_json,
      doctor_dose_note: row.doctor_dose_note,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
    }));
  }
  return [...medicineRecords.values()].sort((left, right) => right.updated_at.localeCompare(left.updated_at));
}

function getMedicineName(medicine: Medicine): string {
  const field = medicine.drug_name as unknown;
  if (typeof field === 'string') return field;
  if (field && typeof field === 'object') {
    const record = field as Record<string, unknown>;
    const value = record.display_value ?? record.material_value ?? record.catalog_value;
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '药品';
}

function getCitationValue(field: unknown): string {
  if (typeof field === 'string') return field;
  if (!field || typeof field !== 'object') return '';
  const record = field as Record<string, unknown>;
  const value = record.display_value ?? record.material_value ?? record.catalog_value;
  if (Array.isArray(value)) return value.map(String).filter(Boolean).join('；');
  return typeof value === 'string' ? value : '';
}

function getCitationSources(label: string, field: unknown): string {
  if (!field || typeof field !== 'object') return '';
  const sources = (field as { sources?: Array<{ short_name?: string }> }).sources ?? [];
  const names = [...new Set(sources.map((source) => source.short_name).filter(Boolean))];
  return names.length > 0 ? `${label}：${names.join('、')}` : '';
}

export function toHistoryRecord(record: StoredMedicineRecord): HistoryRecord {
  return {
    id: record.record_id,
    subject_user_id: record.subject_user_id,
    material_type: record.material.material_type,
    risk_level: null,
    analyzed_at: new Date(record.updated_at).toLocaleString('zh-CN', { hour12: false }),
    summary: `${getMedicineName(record.medicine)}识别结果${record.doctor_dose_note ? '（医生用药说明已更新）' : ''}`,
    thumbnail: '/file.svg',
    status: 'confirmed',
    detail_sections: [
      {
        title: '上传材料与识别结果',
        items: [
          `材料分类：${record.material.type_label || record.material.material_type}`,
          `识别置信度：${Math.round(record.material.confidence > 1 ? record.material.confidence : record.material.confidence * 100)}%`,
          `图片质量：${record.material.quality}`,
          `分类依据：${record.material.classification_reason || '未提供'}`,
          `OCR原文：${record.material.ocr_text || '未识别到文字'}`,
          `图片内容说明：${record.material.image_description || '未提供'}`,
        ],
      },
      {
        title: '药品详细信息',
        items: [
          `药品名称：${getCitationValue(record.medicine.drug_name) || '未识别'}`,
          `规格：${getCitationValue(record.medicine.specification) || '未识别'}`,
          `批准文号：${getCitationValue(record.medicine.approval_number) || '未识别'}`,
          `生产企业：${getCitationValue(record.medicine.manufacturer) || '未识别'}`,
          `适用人群/用途：${getCitationValue(record.medicine.indication_from_instruction) || '未识别到相关信息，请仔细核对药品说明'}`,
          `单次用量：${getCitationValue(record.medicine.dose_from_material) || '未识别'}`,
          `用药频次：${getCitationValue(record.medicine.frequency_from_material) || '未识别'}`,
          `用药时间：${getCitationValue(record.medicine.timing_from_material) || '未识别'}`,
        ],
      },
      {
        title: '重要提示',
        items: [
          `重要提醒：${getCitationValue(record.medicine.important_warnings) || '未识别到相关信息，请仔细核对药品说明'}`,
          `禁忌：${getCitationValue(record.medicine.contraindications) || '未识别到相关信息，请仔细核对药品说明'}`,
          `常见不良反应：${getCitationValue(record.medicine.adverse_reactions) || '未识别到相关信息，请仔细核对药品说明'}`,
          `储存要求：${getCitationValue(record.medicine.storage) || '未识别到相关信息，请仔细核对药品说明'}`,
        ],
      },
      {
        title: '信息来源与医生说明',
        items: [
          getCitationSources('药品名称', record.medicine.drug_name),
          getCitationSources('批准文号', record.medicine.approval_number),
          getCitationSources('用法用量', record.medicine.dose_from_material),
          getCitationSources('重要提醒', record.medicine.important_warnings),
          `来源说明：${record.medicine.source_note || '未提供'}`,
          `医生用药说明：${record.doctor_dose_note || '未填写'}`,
        ].filter(Boolean),
      },
    ],
  };
}

export async function createFamilyShare(brief: FamilyBrief): Promise<StoredFamilyShare> {
  const now = new Date();
  const share: StoredFamilyShare = {
    token: randomUUID().replaceAll('-', ''),
    brief,
    created_at: now.toISOString(),
    expires_at: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  };

  if (hasDatabase()) {
    await ensureTables();
    const pool = await getPool();
    await pool.query(
      `INSERT INTO yinling_family_shares (token, brief_json, created_at, expires_at)
       VALUES ($1,$2::jsonb,$3,$4)`,
      [share.token, JSON.stringify(share.brief), share.created_at, share.expires_at]
    );
  } else {
    familyShares.set(share.token, share);
  }
  return share;
}

export async function getFamilyShare(token: string): Promise<StoredFamilyShare | null> {
  let share: StoredFamilyShare | null = null;
  if (hasDatabase()) {
    await ensureTables();
    const pool = await getPool();
    const result = await pool.query<{
      token: string;
      brief_json: FamilyBrief;
      created_at: Date;
      expires_at: Date;
    }>(
      `SELECT token, brief_json, created_at, expires_at
       FROM yinling_family_shares WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );
    const row = result.rows[0];
    if (row) {
      share = {
        token: row.token,
        brief: row.brief_json,
        created_at: row.created_at.toISOString(),
        expires_at: row.expires_at.toISOString(),
      };
    }
  } else {
    share = familyShares.get(token) ?? null;
  }

  if (share && new Date(share.expires_at).getTime() <= Date.now()) {
    familyShares.delete(token);
    return null;
  }
  return share;
}
