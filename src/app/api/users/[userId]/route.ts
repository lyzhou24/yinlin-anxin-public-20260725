import { NextResponse } from 'next/server';
import { userStore } from '@/lib/server/user-store';
import type { UserAccount, UserProfile, UserRole } from '@/lib/types';

interface UpdateUserRequest {
  username?: string;
  phone?: string;
  user_role?: UserRole;
  birth_year?: number;
  has_chronic_disease?: boolean;
  chronic_diseases?: string;
  verification_code?: string;
  profile_completed?: boolean;
}

function maskPhone(phone: string): string {
  return /^1\d{10}$/.test(phone) ? `${phone.slice(0, 3)}****${phone.slice(7)}` : phone;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
  const { userId } = await context.params;
  const user = userStore.get(userId);
  if (!user) {
    return NextResponse.json({
      success: false,
      data: null,
      error_code: 'USER_NOT_FOUND',
      error_message: '用户资料尚未建立。',
    }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: user,
    error_code: null,
    error_message: null,
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
  const { userId } = await context.params;
  const body = await request.json().catch(() => ({})) as UpdateUserRequest;
  const existing = userStore.get(userId);
  const username = body.username?.trim();
  const phone = body.phone?.trim();

  if (username !== undefined && (!username || username.length > 30)) {
    return NextResponse.json({
      success: false,
      data: null,
      error_code: 'ACCOUNT_USERNAME_INVALID',
      error_message: '用户名应为1至30个字符。',
    }, { status: 400 });
  }
  if (phone !== undefined && !/^1\d{10}$/.test(phone) && !/^1\d{2}\*{4}\d{4}$/.test(phone)) {
    return NextResponse.json({
      success: false,
      data: null,
      error_code: 'ACCOUNT_PHONE_INVALID',
      error_message: '请输入正确的11位手机号。',
    }, { status: 400 });
  }
  if (/^1\d{10}$/.test(phone || '') && phone !== existing?.account.phone) {
    const expectedCode = process.env.TEST_SMS_CODE || '123456';
    if (body.verification_code?.trim() !== expectedCode) {
      return NextResponse.json({
        success: false,
        data: null,
        error_code: 'ACCOUNT_PHONE_CODE_INVALID',
        error_message: '验证码不正确，手机号尚未修改。',
      }, { status: 400 });
    }
  }
  if (
    body.birth_year !== undefined
    && (!Number.isInteger(body.birth_year) || body.birth_year < 1900 || body.birth_year > new Date().getFullYear())
  ) {
    return NextResponse.json({
      success: false,
      data: null,
      error_code: 'PROFILE_BIRTH_YEAR_INVALID',
      error_message: '请输入正确的出生年份。',
    }, { status: 400 });
  }
  if (
    body.has_chronic_disease === true
    && (!body.chronic_diseases?.trim() || body.chronic_diseases.trim().length > 200)
  ) {
    return NextResponse.json({
      success: false,
      data: null,
      error_code: 'PROFILE_CHRONIC_DISEASES_INVALID',
      error_message: '请填写具体的基础疾病，最多200个字符。',
    }, { status: 400 });
  }

  const now = new Date().toISOString();
  const account: UserAccount = {
    user_id: userId,
    username: username ?? existing?.account.username ?? '用户',
    phone: phone !== undefined ? maskPhone(phone) : existing?.account.phone ?? '',
    login_type: existing?.account.login_type ?? 'test_account',
    account_status: existing?.account.account_status ?? 'active',
    created_at: existing?.account.created_at ?? now,
    last_login_at: now,
  };
  const profile: UserProfile = {
    user_id: userId,
    user_role: body.user_role ?? existing?.profile.user_role ?? 'family',
    display_name: username ?? existing?.profile.display_name ?? account.username,
    birth_year: body.birth_year ?? existing?.profile.birth_year,
    has_chronic_disease: body.has_chronic_disease ?? existing?.profile.has_chronic_disease,
    chronic_diseases: body.has_chronic_disease === false
      ? undefined
      : body.chronic_diseases?.trim() ?? existing?.profile.chronic_diseases,
    profile_completed: body.profile_completed ?? existing?.profile.profile_completed ?? false,
    allow_family_binding: existing?.profile.allow_family_binding ?? true,
  };

  userStore.set(userId, { account, profile });

  return NextResponse.json({
    success: true,
    data: { account, profile },
    error_code: null,
    error_message: null,
  });
}
