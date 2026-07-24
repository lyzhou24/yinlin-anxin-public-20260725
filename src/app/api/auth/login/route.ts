import { NextResponse } from 'next/server';

interface LoginRequest {
  username?: string;
  phone?: string;
  code?: string;
  agreements?: {
    user_agreement?: boolean;
    privacy_policy?: boolean;
  };
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json() as LoginRequest;
    const username = body.username?.trim() || '';
    const phone = body.phone?.trim() || '';

    if (!username || username.length > 30) {
      return NextResponse.json({
        success: false,
        data: null,
        error_code: 'AUTH_USERNAME_INVALID',
        error_message: '请输入1至30个字符的用户名。',
      }, { status: 400 });
    }

    if (!/^1\d{10}$/.test(phone)) {
      return NextResponse.json({
        success: false,
        data: null,
        error_code: 'AUTH_PHONE_INVALID',
        error_message: '请输入正确的11位手机号。',
      }, { status: 400 });
    }

    if (!body.code?.trim()) {
      return NextResponse.json({
        success: false,
        data: null,
        error_code: 'AUTH_CODE_REQUIRED',
        error_message: '请输入验证码或测试密码。',
      }, { status: 400 });
    }

    if (!body.agreements?.user_agreement || !body.agreements?.privacy_policy) {
      return NextResponse.json({
        success: false,
        data: null,
        error_code: 'AUTH_AGREEMENT_REQUIRED',
        error_message: '请阅读并同意用户协议和隐私说明。',
      }, { status: 400 });
    }

    const now = new Date().toISOString();
    const userId = `usr_${phone.slice(-8)}`;

    return NextResponse.json({
      success: true,
      data: {
        user: {
          user_id: userId,
          username,
          phone: `${phone.slice(0, 3)}****${phone.slice(7)}`,
          phone_full: phone,
          login_type: 'test_account',
          account_status: 'active',
          created_at: now,
          last_login_at: now,
        },
        session: {
          session_id: `local_${userId}_${Date.now()}`,
          storage: 'browser',
        },
        role_status: 'client_managed',
      },
      error_code: null,
      error_message: null,
    });
  } catch {
    return NextResponse.json({
      success: false,
      data: null,
      error_code: 'AUTH_INVALID_REQUEST',
      error_message: '登录请求格式不正确，请重新输入。',
    }, { status: 400 });
  }
}
