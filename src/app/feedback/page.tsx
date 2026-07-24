'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { MOCK_HISTORY } from '@/lib/mock-data';

const FEEDBACK_TYPES = [
  '分类错误',
  '药品识别错误',
  '药品真实性核验错误',
  '风险判断不准确',
  '结果太复杂，看不懂',
  '已经向医生确认，系统判断有误',
  '需要家属帮助',
  '其他',
];

export default function FeedbackPage() {
  const [feedbackType, setFeedbackType] = useState(FEEDBACK_TYPES[0]);
  const [relatedRecord, setRelatedRecord] = useState('');
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');
  const [allowUse, setAllowUse] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [supplementaryImages, setSupplementaryImages] = useState<string[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
      newImages.push(URL.createObjectURL(files[i]));
    }
    setSupplementaryImages((prev) => [...prev, ...newImages]);
  };

  const handleRemoveImage = (index: number) => {
    setSupplementaryImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 模拟提交
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div>
        <PageHeader
          title="反馈与复核"
          subtitle="帮助我们改进，让结果更准确、更易懂"
          backHref="/"
        />
        <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-8 text-center">
          <span className="text-5xl block mb-4" aria-hidden="true">✅</span>
          <h2 className="text-2xl font-bold text-green-800 mb-3">感谢您的反馈</h2>
          <p className="text-base text-green-700 leading-relaxed mb-6">
            我们将持续改进，让分析结果更准确、更易懂。
          </p>
          <Link
            href="/"
            className="inline-block bg-primary text-primary-foreground rounded-xl px-8 py-4 text-xl font-semibold hover:opacity-90 transition-opacity"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="反馈与复核"
        subtitle="帮助我们改进，让结果更准确、更易懂"
        backHref="/"
      />

      <form onSubmit={handleSubmit}>
        {/* 反馈类型 */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-4">
          <h3 className="text-xl font-bold text-foreground mb-4">反馈类型</h3>
          <div className="space-y-3">
            {FEEDBACK_TYPES.map((type) => (
              <label
                key={type}
                className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <input
                  type="radio"
                  name="feedbackType"
                  value={type}
                  checked={feedbackType === type}
                  onChange={() => setFeedbackType(type)}
                  className="w-5 h-5 accent-primary"
                />
                <span className="text-base text-foreground">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 关联记录 */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-4">
          <h3 className="text-xl font-bold text-foreground mb-4">关联记录（可选）</h3>
          <select
            value={relatedRecord}
            onChange={(e) => setRelatedRecord(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">请选择关联的分析记录</option>
            {MOCK_HISTORY.map((record) => (
              <option key={record.id} value={record.id}>
                {record.summary}（{record.analyzed_at}）
              </option>
            ))}
          </select>
        </div>

        {/* 问题描述 */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-4">
          <h3 className="text-xl font-bold text-foreground mb-4">问题描述</h3>
          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请描述您遇到的问题，便于我们定位原因..."
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* 补充图片上传 */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-4">
          <h3 className="text-xl font-bold text-foreground mb-4">补充图片（可选）</h3>
          <p className="mb-2 text-base text-muted-foreground">
            {supplementaryImages.length === 0 ? '当前未选择任何文件' : `已选择 ${supplementaryImages.length} 张图片`}
          </p>
          <input
            id="supplementary-images"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="sr-only"
          />
          <label
            htmlFor="supplementary-images"
            className="mb-4 inline-flex cursor-pointer items-center rounded-xl border border-border bg-background px-5 py-3 text-base font-semibold text-foreground hover:border-primary transition-colors"
          >
            选择文件
          </label>
          {supplementaryImages.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {supplementaryImages.map((url, i) => (
                <div key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`补充图片 ${i + 1}`} className="w-full h-24 object-cover rounded-xl" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 提交确认 */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-4">
          <h3 className="text-xl font-bold text-foreground mb-4">提交确认</h3>
          <label className="flex items-start gap-3 mb-4">
            <input
              type="checkbox"
              checked={allowUse}
              onChange={(e) => setAllowUse(e.target.checked)}
              className="w-5 h-5 accent-primary mt-0.5"
            />
            <span className="text-base text-foreground">
              允许使用此反馈改进系统（仅用于优化测试集和提示词）
            </span>
          </label>
          <div>
            <label className="block text-base text-foreground mb-2">联系方式（可选，用于回访）</label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="手机号或微信号"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="submit"
            className="flex-1 bg-primary text-primary-foreground rounded-xl px-8 py-4 text-xl font-semibold hover:opacity-90 transition-opacity"
          >
            提交反馈
          </button>
          <Link
            href="/"
            className="flex-1 bg-muted text-foreground rounded-xl px-8 py-4 text-xl font-semibold text-center hover:opacity-90 transition-opacity"
          >
            返回首页
          </Link>
        </div>
      </form>
    </div>
  );
}
