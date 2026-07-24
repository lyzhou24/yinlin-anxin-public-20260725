import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { MOCK_DOCTOR_QUESTIONS } from '@/lib/mock-data';

export default function DoctorPage() {
  const questions = MOCK_DOCTOR_QUESTIONS;

  return (
    <div>
      <PageHeader
        title="问医生清单"
        subtitle="整理好的问题，就诊时可以逐条询问医生或药师"
        backHref="/"
      />

      {/* 固定提示 */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 mb-6" role="alert">
        <p className="text-amber-800 text-base leading-relaxed">
          <span className="text-xl mr-1" aria-hidden="true">⚕️</span>
          本页面只帮助整理问题，最终医学判断应由医生或药师作出。
        </p>
      </div>

      {/* 需要优先询问的问题 */}
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-4">
        <h3 className="text-xl font-bold text-red-700 mb-4">🔴 需要优先询问的问题</h3>
        <ol className="space-y-3">
          {questions.priority_questions.map((q, i) => (
            <li key={i} className="flex items-start gap-2 text-base text-foreground leading-relaxed">
              <span className="font-bold text-red-600 shrink-0">{i + 1}.</span>
              {q}
            </li>
          ))}
        </ol>
      </div>

      {/* 用药相关问题 */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-4">
        <h3 className="text-xl font-bold text-foreground mb-4">💊 用药相关问题</h3>
        <ol className="space-y-3">
          {questions.medicine_questions.map((q, i) => (
            <li key={i} className="flex items-start gap-2 text-base text-foreground leading-relaxed">
              <span className="font-semibold text-muted-foreground shrink-0">{i + 1}.</span>
              {q}
            </li>
          ))}
        </ol>
      </div>

      {/* 保健品或推销产品相关问题 */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-4">
        <h3 className="text-xl font-bold text-foreground mb-4">🏷️ 保健品或推销产品相关问题</h3>
        <ol className="space-y-3">
          {questions.supplement_questions.map((q, i) => (
            <li key={i} className="flex items-start gap-2 text-base text-foreground leading-relaxed">
              <span className="font-semibold text-muted-foreground shrink-0">{i + 1}.</span>
              {q}
            </li>
          ))}
        </ol>
      </div>

      {/* 就诊时建议携带的材料 */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-6">
        <h3 className="text-xl font-bold text-primary mb-4">📁 就诊时建议携带的材料</h3>
        <ul className="space-y-2">
          {questions.bring_materials.map((m, i) => (
            <li key={i} className="flex items-start gap-2 text-base text-foreground leading-relaxed">
              <span className="shrink-0" aria-hidden="true">•</span>
              {m}
            </li>
          ))}
        </ul>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/"
          className="flex-1 bg-primary text-primary-foreground rounded-xl px-8 py-4 text-xl font-semibold text-center hover:opacity-90 transition-opacity"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
