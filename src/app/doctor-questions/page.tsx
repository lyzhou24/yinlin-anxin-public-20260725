'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { MOCK_DOCTOR_QUESTIONS } from '@/lib/mock-data';
import type { DoctorQuestion, QuestionPriority } from '@/lib/types';

const PRIORITY_STYLES: Record<QuestionPriority, { label: string; bg: string; text: string }> = {
  high: { label: '高优先级', bg: 'bg-red-100', text: 'text-red-700' },
  medium: { label: '中优先级', bg: 'bg-amber-100', text: 'text-amber-700' },
  low: { label: '低优先级', bg: 'bg-green-100', text: 'text-green-700' },
};

export default function DoctorPage() {
  const { priority_questions, medicine_questions, supplement_questions, bring_materials } = MOCK_DOCTOR_QUESTIONS;
  const questions: DoctorQuestion[] = [
    ...priority_questions.map((text) => ({ priority: 'high' as const, text, background: '涉及当前用药安全，请优先咨询医生。', related_materials: ['当前用药材料'], uncertain_fields: [] })),
    ...medicine_questions.map((text) => ({ priority: 'medium' as const, text, background: '来自药品说明或用法用量中的待确认信息。', related_materials: ['药品包装盒或说明书'], uncertain_fields: [] })),
    ...supplement_questions.map((text) => ({ priority: 'low' as const, text, background: '来自保健品材料或相关宣传内容。', related_materials: ['保健品宣传材料'], uncertain_fields: [] })),
  ];
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [customQuestion, setCustomQuestion] = useState('');
  const [customQuestions, setCustomQuestions] = useState<string[]>([]);

  const toggleExpand = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  const handleAddCustom = () => {
    if (customQuestion.trim()) {
      setCustomQuestions((prev) => [...prev, customQuestion.trim()]);
      setCustomQuestion('');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    alert('导出图片功能开发中，将生成长图便于微信发给医生。');
  };

  const handleRegenerate = () => {
    alert('重新生成功能开发中，将基于最新上传材料重新整理问题。');
  };

  return (
    <div>
      <PageHeader
        title="问医生清单"
        subtitle="以下问题由系统根据您上传的材料整理，请携带材料原件就诊"
        backHref="/"
      />

      {/* 固定提示 */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 mb-6" role="alert">
        <p className="text-amber-800 text-base leading-relaxed">
          <span className="text-xl mr-1" aria-hidden="true">⚕️</span>
          本页面只帮助整理问题，最终医学判断应由医生或药师作出。
        </p>
      </div>

      {/* 操作按钮 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <button
          onClick={handlePrint}
          className="bg-primary text-primary-foreground rounded-xl px-4 py-3 text-base font-semibold hover:opacity-90 transition-opacity"
        >
          🖨️ 打印清单
        </button>
        <button
          onClick={handleExport}
          className="bg-secondary text-secondary-foreground rounded-xl px-4 py-3 text-base font-semibold hover:opacity-90 transition-opacity"
        >
          🖼️ 导出图片
        </button>
        <button
          onClick={handleRegenerate}
          className="bg-muted text-foreground rounded-xl px-4 py-3 text-base font-semibold hover:opacity-90 transition-opacity"
        >
          🔄 重新生成
        </button>
      </div>

      {/* 问题列表 */}
      <div className="space-y-4 mb-6">
        {questions.map((question, index) => (
          <QuestionCard
            key={index}
            question={question}
            index={index}
            isExpanded={expandedIndex === index}
            onToggle={() => toggleExpand(index)}
          />
        ))}
        {customQuestions.map((q, index) => (
          <div
            key={`custom-${index}`}
            className="bg-card border-2 border-dashed border-border rounded-2xl p-5"
          >
            <div className="flex items-start gap-3">
              <span className={`text-sm font-semibold px-2 py-0.5 rounded ${PRIORITY_STYLES.low.bg} ${PRIORITY_STYLES.low.text}`}>
                自定义
              </span>
              <p className="text-base text-foreground leading-relaxed">{q}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 添加自定义问题 */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <h3 className="text-xl font-bold text-foreground mb-4">➕ 添加自定义问题</h3>
        <textarea
          rows={2}
          value={customQuestion}
          onChange={(e) => setCustomQuestion(e.target.value)}
          placeholder="输入您想补充询问医生的问题..."
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-3"
        />
        <button
          onClick={handleAddCustom}
          className="bg-primary text-primary-foreground rounded-xl px-6 py-3 text-base font-semibold hover:opacity-90 transition-opacity"
        >
          添加问题
        </button>
      </div>

      {/* 就诊时建议携带的材料 */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-6">
        <h3 className="text-xl font-bold text-primary mb-4">📁 就诊时建议携带的材料</h3>
        <ul className="space-y-2">
          {bring_materials.map((m, i) => (
            <li key={i} className="flex items-start gap-2 text-base text-foreground leading-relaxed">
              <span className="shrink-0" aria-hidden="true">•</span>
              {m}
            </li>
          ))}
        </ul>
      </div>

      {/* 底部按钮 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/"
          className="flex-1 bg-primary text-primary-foreground rounded-xl px-8 py-4 text-xl font-semibold text-center hover:opacity-90 transition-opacity"
        >
          返回首页
        </Link>
        <Link
          href="/family"
          className="flex-1 bg-secondary text-secondary-foreground rounded-xl px-8 py-4 text-xl font-semibold text-center hover:opacity-90 transition-opacity"
        >
          生成家属简报
        </Link>
      </div>
    </div>
  );
}

function QuestionCard({
  question,
  index,
  isExpanded,
  onToggle,
}: {
  question: DoctorQuestion;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const style = PRIORITY_STYLES[question.priority];

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-start gap-3">
        <span className={`text-sm font-semibold px-2 py-0.5 rounded shrink-0 ${style.bg} ${style.text}`}>
          {style.label}
        </span>
        <div className="flex-1">
          <p className="text-base text-foreground leading-relaxed">
            <span className="font-semibold">{index + 1}.</span> {question.text}
          </p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className="mt-3 text-primary text-base hover:opacity-80 transition-opacity"
      >
        {isExpanded ? '收起详情 ▲' : '查看详情 ▼'}
      </button>
      {isExpanded && (
        <div className="mt-4 bg-muted/30 rounded-xl p-4 space-y-3">
          <div>
            <h4 className="font-semibold text-foreground mb-1">问题背景</h4>
            <p className="text-base text-muted-foreground">{question.background}</p>
          </div>
          {question.related_materials.length > 0 && (
            <div>
              <h4 className="font-semibold text-foreground mb-1">关联材料</h4>
              <p className="text-base text-muted-foreground">
                {question.related_materials.map((m, i) => `材料${i + 1}：${m}`).join('；')}
              </p>
            </div>
          )}
          {question.uncertain_fields.length > 0 && (
            <div>
              <h4 className="font-semibold text-foreground mb-1">当前无法确认的字段</h4>
              <p className="text-base text-muted-foreground">{question.uncertain_fields.join('；')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
