import { getFamilyShare } from '@/lib/server/analysis-record-store';
import { RISK_LEVEL_LABELS } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function SharedFamilyBriefPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const share = await getFamilyShare(token);

  if (!share) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <h1 className="text-3xl font-bold text-red-700">分享链接已失效</h1>
        <p className="mt-4 text-lg text-red-700">家属简报链接仅保留三天，请联系分享人重新生成。</p>
      </div>
    );
  }

  const brief = share.brief;
  return (
    <article className="mx-auto max-w-3xl rounded-2xl border border-border bg-white p-6 sm:p-10">
      <h1 className="text-center text-4xl font-bold text-foreground">银龄安心·家属简报</h1>
      <p className="mt-3 text-center text-base text-muted-foreground">
        生成时间：{new Date(share.created_at).toLocaleString('zh-CN', { hour12: false })}
      </p>
      <p className="mt-1 text-center text-base text-muted-foreground">
        链接有效至：{new Date(share.expires_at).toLocaleString('zh-CN', { hour12: false })}
      </p>

      <section className="mt-8 border-t border-border pt-6">
        <h2 className="text-2xl font-bold text-foreground">情况摘要</h2>
        <p className="mt-3 text-lg leading-relaxed text-foreground">{brief.material_summary}</p>
        <p className="mt-2 text-lg text-foreground">涉及产品或人员：{brief.product_or_person || '暂未确认'}</p>
        <p className="mt-2 text-lg text-foreground">
          当前风险：{RISK_LEVEL_LABELS[brief.highest_risk]}
        </p>
      </section>

      <section className="mt-8 border-t border-border pt-6">
        <h2 className="text-2xl font-bold text-foreground">关键证据</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-6 text-lg leading-relaxed text-foreground">
          {brief.key_evidence.map((item) => <li key={item}>{item}</li>)}
        </ol>
      </section>

      <section className="mt-8 border-t border-border pt-6">
        <h2 className="text-2xl font-bold text-foreground">建议家人先做</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-6 text-lg leading-relaxed text-foreground">
          {brief.next_actions.map((item) => <li key={item}>{item}</li>)}
        </ol>
      </section>

      <p className="mt-8 rounded-xl bg-amber-50 p-4 text-base leading-relaxed text-amber-900">
        本简报用于帮助家人沟通和核实，不替代医生、药师或有关部门的专业意见。
      </p>
    </article>
  );
}
