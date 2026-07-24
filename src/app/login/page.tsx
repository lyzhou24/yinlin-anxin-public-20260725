'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { completeLocalLogin } from '@/lib/auth-session';

const AGREEMENT_CONTENT = {
  user: {
    title: '用户协议',
    sections: [
      ['一、服务说明', '银龄安心帮助用户整理上传材料中的药品信息和健康消费风险线索，提供大字版说明、风险提示和家庭协同入口。系统结果仅供辅助理解和核实，不构成诊断、处方、法律认定或投资建议。'],
      ['二、账户使用', '请使用本人可以正常接收信息的手机号注册或登录，并妥善保管验证码和登录设备。请勿冒用他人身份、转借账户或利用本服务获取未经授权的他人信息。'],
      ['三、材料上传', '请仅上传您有权处理的材料，并尽量遮挡与本次分析无关的身份证号、银行卡号、住址、验证码等敏感信息。请勿上传违法、侵权、恶意或与服务无关的内容。'],
      ['四、结果使用', '图片识别和智能分析可能受到清晰度、材料完整性和知识更新影响。涉及用药请以药盒、说明书、处方和医生或药师意见为准；涉及转账或疑似诈骗时，请先停止操作并向可信家人或有关部门核实。'],
      ['五、家庭协同', '只有在老人明确绑定并授权后，家属才能查看相应摘要或接收提醒。用户应尊重家庭成员的知情权和隐私，不得将获得的信息用于约定范围之外的用途。'],
      ['六、协议调整', '随着功能完善，本协议可能进行更新。重要调整会在页面中提示；继续使用服务前，请重新阅读相关内容。如不同意调整，可停止使用本服务。'],
    ],
  },
  privacy: {
    title: '隐私说明',
    sections: [
      ['一、我们处理的信息', '为完成登录和材料分析，我们可能处理用户名、手机号、用户选择的身份，以及您主动上传的药盒、说明书、处方、聊天记录、宣传材料或付款凭证中的内容。'],
      ['二、信息用途', '上述信息仅用于创建和保持登录状态、识别材料类型、提取文字、整理药品说明、分析健康消费风险，以及在您授权时提供家庭协同功能。'],
      ['三、敏感信息保护', '上传前请尽量遮挡身份证号、银行卡号、详细住址、验证码和账号密码。系统不会要求您在材料中提供短信验证码、银行卡密码或支付密码。'],
      ['四、保存与删除', '中期版本的账户状态主要保存在当前浏览器中。材料和分析结果的真实保存期限、删除范围及服务器存储方式，将在正式部署前进一步明确并提供相应控制入口。'],
      ['五、家庭分享', '只有在完成家庭绑定并获得相应授权后，系统才应向家属展示摘要或创建提醒。原图、付款金额、账户信息和历史记录应分别遵循最小授权原则。'],
      ['六、您的选择', '您可以选择不上传材料、停止分析、退出登录，并可通过反馈入口提出更正或删除请求。正式上线前，我们会补充真实联系方式和更完整的隐私权利处理流程。'],
    ],
  },
} as const;

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [privacyRead, setPrivacyRead] = useState(false);
  const [openAgreement, setOpenAgreement] = useState<keyof typeof AGREEMENT_CONTENT | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('请输入用户名。');
      return;
    }
    if (!/^1\d{10}$/.test(phone)) {
      setError('请输入正确的11位手机号。');
      return;
    }
    if (!code) {
      setError('请输入验证码或测试密码。');
      return;
    }
    if (!agreed || !privacyRead) {
      setError('请阅读并同意用户协议和隐私说明。');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          phone,
          code,
          agreements: {
            user_agreement: agreed,
            privacy_policy: privacyRead,
          },
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        setError(json.error_message || '登录失败，请稍后重试。');
        return;
      }

      const session = completeLocalLogin({
        user_id: json.data.user.user_id,
        username: json.data.user.username,
        phone: json.data.user.phone,
        phone_full: json.data.user.phone_full,
        last_login_at: json.data.user.last_login_at,
      });
      router.push(session.user_role ? '/' : '/role-select');
    } catch {
      setError('网络连接失败，请检查网络后重试。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex flex-col justify-center py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-3">银龄安心</h1>
        <p className="text-xl text-muted-foreground">登录银龄安心</p>
      </div>

      <form onSubmit={handleLogin} className="w-full max-w-md mx-auto space-y-6">
        <div>
          <label htmlFor="username" className="block text-base font-semibold text-foreground mb-2">
            用户名
          </label>
          <input
            id="username"
            type="text"
            maxLength={30}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="请输入用户名"
            autoComplete="username"
            className="w-full rounded-xl border border-border bg-background px-4 py-4 text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-base font-semibold text-foreground mb-2">
            手机号
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            maxLength={11}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="请输入手机号"
            className="w-full rounded-xl border border-border bg-background px-4 py-4 text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="code" className="block text-base font-semibold text-foreground mb-2">
            验证码 / 测试密码
          </label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="请输入验证码"
            className="w-full rounded-xl border border-border bg-background px-4 py-4 text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="mt-2 text-base text-muted-foreground">
            若未注册，首次登录将自动注册新账号
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <input
              id="user-agreement"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-5 h-5 accent-primary mt-1"
            />
            <span className="text-base text-foreground leading-relaxed">
              <label htmlFor="user-agreement" className="cursor-pointer">我已阅读并同意《</label>
              <button
                type="button"
                onClick={() => setOpenAgreement('user')}
                className="underline underline-offset-4 hover:text-primary"
              >
                用户协议
              </button>
              <label htmlFor="user-agreement" className="cursor-pointer">》</label>
            </span>
          </div>
          <div className="flex items-start gap-3">
            <input
              id="privacy-agreement"
              type="checkbox"
              checked={privacyRead}
              onChange={(e) => setPrivacyRead(e.target.checked)}
              className="w-5 h-5 accent-primary mt-1"
            />
            <span className="text-base text-foreground leading-relaxed">
              <label htmlFor="privacy-agreement" className="cursor-pointer">我已阅读并同意《</label>
              <button
                type="button"
                onClick={() => setOpenAgreement('privacy')}
                className="underline underline-offset-4 hover:text-primary"
              >
                隐私说明
              </button>
              <label htmlFor="privacy-agreement" className="cursor-pointer">》</label>
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-base text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-primary-foreground rounded-xl px-8 py-4 text-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {isLoading ? '正在登录……' : '登录/注册'}
        </button>
      </form>

      {openAgreement && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-5" role="dialog" aria-modal="true" aria-labelledby="agreement-title">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-5 sm:p-7 shadow-2xl">
            <button
              type="button"
              onClick={() => setOpenAgreement(null)}
              aria-label="关闭"
              className="absolute -right-3 -top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl font-bold text-black shadow-lg"
            >
              ×
            </button>
            <h2 id="agreement-title" className="mb-4 text-center text-2xl font-bold text-foreground">
              {AGREEMENT_CONTENT[openAgreement].title}
            </h2>
            <div className="max-h-[60vh] overflow-y-auto rounded-2xl bg-green-50 p-5 text-lg leading-relaxed text-black">
              <p className="mb-5">
                欢迎使用银龄安心。以下内容为中期版本草案，后续将结合正式功能、数据保存方式和法律审核进一步完善。
              </p>
              <div className="space-y-5">
                {AGREEMENT_CONTENT[openAgreement].sections.map(([heading, body]) => (
                  <section key={heading}>
                    <h3 className="mb-1 font-bold">{heading}</h3>
                    <p>{body}</p>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
