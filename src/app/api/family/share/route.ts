import { NextResponse } from 'next/server';
import { createFamilyShare } from '@/lib/server/analysis-record-store';
import type { FamilyBrief } from '@/lib/types';

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json().catch(() => ({})) as { brief?: FamilyBrief };
  if (!body.brief) {
    return NextResponse.json({
      success: false,
      data: null,
      error_code: 'FAMILY_SHARE_INVALID',
      error_message: '缺少家属简报内容。',
    }, { status: 400 });
  }

  try {
    const share = await createFamilyShare(body.brief);
    return NextResponse.json({
      success: true,
      data: {
        share_url: new URL(`/share/family/${share.token}`, request.url).toString(),
        expires_at: share.expires_at,
      },
      error_code: null,
      error_message: null,
    });
  } catch (error) {
    console.error('[/api/family/share] create failed:', error);
    return NextResponse.json({
      success: false,
      data: null,
      error_code: 'FAMILY_SHARE_CREATE_FAILED',
      error_message: '分享链接生成失败，请稍后重试。',
    }, { status: 500 });
  }
}
