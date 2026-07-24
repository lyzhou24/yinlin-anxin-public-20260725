import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';

export default function PrivacyPage() {
  return (
    <div>
      <PageHeader
        title="隐私说明"
        subtitle="了解我们如何保存、使用和分享您的信息"
        backHref="/"
      />

      {/* 1. 我们为什么需要材料 */}
      <section className="bg-white border border-border rounded-2xl p-6 mb-4">
        <h3 className="text-xl font-bold text-foreground mb-4">1. 我们为什么需要材料</h3>
        <p className="text-base text-foreground leading-relaxed">
          您上传的图片和文件用于识别材料类型、提取文字、核对药品信息、分析健康消费风险，并生成您选择使用的结果或家属简报。
        </p>
      </section>

      {/* 2. 请不要上传无关的敏感信息 */}
      <section className="bg-white border border-border rounded-2xl p-6 mb-4">
        <h3 className="text-xl font-bold text-foreground mb-4">2. 请不要上传无关的敏感信息</h3>
        <p className="text-base text-foreground leading-relaxed mb-3">
          请尽量遮住与本次分析无关的身份证号、住址、银行卡号、完整手机号、验证码、账号密码和其他个人信息。
        </p>
        <p className="text-base text-foreground leading-relaxed">
          系统不会要求您提供短信验证码或账号密码。
        </p>
      </section>

      {/* 3. 系统可能处理哪些内容 */}
      <section className="bg-white border border-border rounded-2xl p-6 mb-4">
        <h3 className="text-xl font-bold text-foreground mb-4">3. 系统可能处理哪些内容</h3>
        <p className="text-base text-foreground leading-relaxed">
          根据您主动上传的材料，可能处理药品信息、说明书内容、聊天记录、宣传材料、订单、付款信息及材料中出现的个人信息。
        </p>
      </section>

      {/* 4. 材料如何保存 */}
      <section className="bg-white border border-border rounded-2xl p-6 mb-4">
        <h3 className="text-xl font-bold text-foreground mb-4">4. 材料如何保存</h3>
        <p className="text-base text-foreground leading-relaxed mb-3">
          <strong>材料用于本次分析，处理完成后不保存原图。</strong>
        </p>
        <p className="text-base text-foreground leading-relaxed mb-3">
          只有在您选择保存时，本次记录才会进入历史记录。您可以在历史记录中查看和删除已保存的记录。
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          正式上线前将补充真实的保存范围、保存时间和删除机制。
        </p>
      </section>

      {/* 5. 家属分享 */}
      <section className="bg-white border border-border rounded-2xl p-6 mb-4">
        <h3 className="text-xl font-bold text-foreground mb-4">5. 家属分享</h3>
        <p className="text-base text-foreground leading-relaxed mb-3">
          只有在您主动确认后，系统才生成或分享家属简报。分享前请检查其中是否包含不需要公开的健康、身份、聊天或付款信息。
        </p>
        <p className="text-base text-foreground leading-relaxed">
          如果系统实现红色风险自动推送，必须在用户首次使用相关功能前单独取得明确授权，并提供关闭方式；没有授权时不得使用“自动推送”文案。
        </p>
      </section>

      {/* 6. AI识别可能出错 */}
      <section className="bg-white border border-border rounded-2xl p-6 mb-4">
        <h3 className="text-xl font-bold text-foreground mb-4">6. AI识别可能出错</h3>
        <p className="text-base text-foreground leading-relaxed">
          图片识别和分析结果可能受到图片清晰度、材料完整性和系统能力影响。请核对药名、规格、批准文号、剂量、频次、付款对象等关键信息。
        </p>
      </section>

      {/* 7. 医疗与风险判断边界 */}
      <section className="bg-white border border-border rounded-2xl p-6 mb-4">
        <h3 className="text-xl font-bold text-foreground mb-4">7. 医疗与风险判断边界</h3>
        <p className="text-base text-foreground leading-relaxed">
          本工具不提供诊断、处方或个人用药方案，也不直接认定任何个人或机构实施诈骗或违法。涉及用药请咨询医生或药师；遇到财产损失或人身安全问题，请及时联系相关平台、监管部门或警方。
        </p>
      </section>

      {/* 8. 您可以做什么 */}
      <section className="bg-white border border-border rounded-2xl p-6 mb-4">
        <h3 className="text-xl font-bold text-foreground mb-4">8. 您可以做什么</h3>
        <p className="text-base text-foreground leading-relaxed">
          您可以选择不上传材料、重新上传、停止分析、取消分享，并按产品实际功能查看或删除已保存的记录。
        </p>
      </section>

      {/* 9. 联系与反馈 */}
      <section className="bg-white border border-border rounded-2xl p-6 mb-6">
        <h3 className="text-xl font-bold text-foreground mb-4">9. 联系与反馈</h3>
        <p className="text-base text-foreground leading-relaxed">
          如果发现识别错误或对隐私处理有疑问，请通过产品提供的反馈渠道联系我们。
        </p>
        <p className="text-base text-muted-foreground leading-relaxed mt-2">
          上线前由项目统筹补充真实联系方式，不得使用虚构电话或邮箱。
        </p>
      </section>

      {/* 返回首页 */}
      <Link
        href="/"
        className="block w-full bg-secondary text-secondary-foreground rounded-xl px-8 py-4 text-xl font-semibold text-center hover:opacity-90 transition-opacity"
      >
        返回首页
      </Link>
    </div>
  );
}
