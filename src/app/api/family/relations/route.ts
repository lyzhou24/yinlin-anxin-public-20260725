import { NextResponse } from 'next/server';
import { MOCK_FAMILY_BIND_SAMPLE_CODE, MOCK_USER_PROFILE_ELDER_BIND_SAMPLE } from '@/lib/mock-data';
import { familyRelationStore } from '@/lib/server/family-relation-store';
import type { FamilyRelation, RelationType } from '@/lib/types';

const SAMPLE_RELATION_ID = 'rel_sample_001';
const SAMPLE_RELATION_TYPES: RelationType[] = ['child', 'spouse', 'caregiver', 'relative', 'other'];

export async function GET(request: Request): Promise<NextResponse> {
  const familyUserId = new URL(request.url).searchParams.get('family_user_id');
  const elderUserId = new URL(request.url).searchParams.get('elder_user_id');
  if (!familyUserId && !elderUserId) {
    return NextResponse.json({
      success: false,
      data: null,
      error_code: 'RELATION_USER_REQUIRED',
      error_message: '缺少家属或老人用户信息。',
    }, { status: 400 });
  }

  const relations = Array.from(familyRelationStore.values()).filter(
    (relation) =>
      relation.status === 'active'
      && (!familyUserId || relation.family_user_id === familyUserId)
      && (!elderUserId || relation.elder_user_id === elderUserId)
  );

  return NextResponse.json({
    success: true,
    data: { relations },
    error_code: null,
    error_message: null,
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json().catch(() => null) as {
    invite_code?: string;
    family_user_id?: string;
    relation_type?: RelationType;
  } | null;

  if (!body?.family_user_id || body.invite_code !== MOCK_FAMILY_BIND_SAMPLE_CODE) {
    return NextResponse.json({
      success: false,
      data: null,
      error_code: 'SAMPLE_INVITE_INVALID',
      error_message: '绑定码无效或已过期。',
    }, { status: 400 });
  }

  const existingRelation = Array.from(familyRelationStore.values()).find(
    (relation) =>
      relation.family_user_id === body.family_user_id
      && relation.elder_user_id === MOCK_USER_PROFILE_ELDER_BIND_SAMPLE.user_id
  );
  if (existingRelation) {
    return NextResponse.json({
      success: true,
      data: { relation: existingRelation, already_bound: true },
      error_code: null,
      error_message: null,
    });
  }

  const now = new Date().toISOString();
  const relation: FamilyRelation = {
    relation_id: SAMPLE_RELATION_ID,
    elder_user_id: MOCK_USER_PROFILE_ELDER_BIND_SAMPLE.user_id,
    family_user_id: body.family_user_id,
    relation_type: body.relation_type && SAMPLE_RELATION_TYPES.includes(body.relation_type)
      ? body.relation_type
      : 'child',
    status: 'active',
    permissions: {
      receive_red_alert: true,
      view_family_report: true,
      upload_for_elder: true,
      view_history_summary: true,
      view_original_image: false,
      view_financial_details: false,
    },
    requested_at: now,
    confirmed_at: now,
  };
  familyRelationStore.set(relation.relation_id, relation);

  return NextResponse.json({
    success: true,
    data: { relation, already_bound: false },
    error_code: null,
    error_message: null,
  }, { status: 201 });
}
