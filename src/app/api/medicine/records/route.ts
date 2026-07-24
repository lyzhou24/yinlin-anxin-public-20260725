import { NextResponse } from 'next/server';
import {
  listMedicineRecords,
  saveMedicineRecord,
  toHistoryRecord,
} from '@/lib/server/analysis-record-store';
import type { Material, Medicine } from '@/lib/types';

interface SaveMedicineRecordRequest {
  user_id?: string;
  subject_user_id?: string;
  material_json?: Material;
  medicine_json?: Medicine;
  doctor_dose_note?: string;
}

export async function GET(): Promise<NextResponse> {
  const records = await listMedicineRecords();
  return NextResponse.json({
    success: true,
    data: {
      records,
      history_records: records.map(toHistoryRecord),
    },
    error_code: null,
    error_message: null,
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json().catch(() => ({})) as SaveMedicineRecordRequest;
  if (!body.user_id || !body.subject_user_id || !body.material_json || !body.medicine_json) {
    return NextResponse.json({
      success: false,
      data: null,
      error_code: 'MEDICINE_RECORD_INVALID',
      error_message: '药品记录缺少必要信息，暂未保存。',
    }, { status: 400 });
  }

  try {
    const record = await saveMedicineRecord({
      user_id: body.user_id,
      subject_user_id: body.subject_user_id,
      material: body.material_json,
      medicine: body.medicine_json,
      doctor_dose_note: body.doctor_dose_note,
    });
    return NextResponse.json({
      success: true,
      data: {
        record,
        history_record: toHistoryRecord(record),
        storage: process.env.PGDATABASE_URL ? 'database' : 'local_server_memory',
      },
      error_code: null,
      error_message: null,
    });
  } catch (error) {
    console.error('[/api/medicine/records] save failed:', error);
    return NextResponse.json({
      success: false,
      data: null,
      error_code: 'MEDICINE_RECORD_SAVE_FAILED',
      error_message: '药品记录保存失败，请稍后重试。',
    }, { status: 500 });
  }
}
