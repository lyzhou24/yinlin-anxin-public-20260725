import { NextResponse } from 'next/server';
import { familyRelationStore } from '@/lib/server/family-relation-store';
import type { FamilyPermissions } from '@/lib/types';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ relationId: string }> }
): Promise<NextResponse> {
  const { relationId } = await context.params;
  const relation = familyRelationStore.get(relationId);
  if (!relation) {
    return NextResponse.json({
      success: false,
      data: null,
      error_code: 'FAMILY_RELATION_NOT_FOUND',
      error_message: '绑定关系不存在或已解除。',
    }, { status: 404 });
  }

  const body = await request.json().catch(() => ({})) as {
    family_user_id?: string;
    permissions?: FamilyPermissions;
  };
  if (body.family_user_id !== relation.family_user_id) {
    return NextResponse.json({
      success: false,
      data: null,
      error_code: 'FAMILY_PERMISSION_DENIED',
      error_message: '您没有修改该绑定关系的权限。',
    }, { status: 403 });
  }
  if (!body.permissions) {
    return NextResponse.json({
      success: false,
      data: null,
      error_code: 'FAMILY_PERMISSIONS_REQUIRED',
      error_message: '缺少权限设置。',
    }, { status: 400 });
  }

  const updatedRelation = {
    ...relation,
    permissions: { ...body.permissions },
  };
  familyRelationStore.set(relationId, updatedRelation);

  return NextResponse.json({
    success: true,
    data: { relation: updatedRelation },
    error_code: null,
    error_message: null,
  });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ relationId: string }> }
): Promise<NextResponse> {
  const { relationId } = await context.params;
  const relation = familyRelationStore.get(relationId);
  if (!relation) {
    return NextResponse.json({
      success: false,
      data: null,
      error_code: 'FAMILY_RELATION_NOT_FOUND',
      error_message: '绑定关系不存在或已解除。',
    }, { status: 404 });
  }

  const body = await request.json().catch(() => ({})) as { family_user_id?: string };
  if (body.family_user_id !== relation.family_user_id) {
    return NextResponse.json({
      success: false,
      data: null,
      error_code: 'FAMILY_PERMISSION_DENIED',
      error_message: '您没有解除该绑定关系的权限。',
    }, { status: 403 });
  }

  familyRelationStore.delete(relationId);

  return NextResponse.json({
    success: true,
    data: {
      relation_id: relationId,
      elder_user_id: relation.elder_user_id,
      status: 'revoked',
      revoked_at: new Date().toISOString(),
      access_revoked: true,
    },
    error_code: null,
    error_message: null,
  });
}
