import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { ERROR_CODE_INFO } from '@/lib/types';
import type { ErrorCode } from '@/lib/types';

const ALL_ERROR_CODES: ErrorCode[] = [
  'unsupported_format',
  'file_too_large',
  'image_blurry',
  'ocr_failed',
  'type_uncertain',
  'ai_failed',
  'network_error',
  'approval_number_not_found',
  'approval_number_mismatch',
  'qrcode_only',
  'save_failed',
  'delete_failed',
];

const ERROR_ICONS: Record<ErrorCode, string> = {
  unsupported_format: '📄',
  file_too_large: '📦',
  image_blurry: '📷',
  ocr_failed: '🔍',
  type_uncertain: '❓',
  ai_failed: '🤖',
  network_error: '📡',
  approval_number_not_found: '🔎',
  approval_number_mismatch: '⚠️',
  qrcode_only: '📱',
  save_failed: '💾',
  delete_failed: '🗑️',
};

export default function ErrorPage() {
  return (
    <div>
      <PageHeader
        title="出错了"
        subtitle="以下是可能遇到的错误情况及解决方法"
        backHref="/"
      />

      <div className="space-y-4">
        {ALL_ERROR_CODES.map((code) => {
          const info = ERROR_CODE_INFO[code];
          return (
            <div key={code} className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-3xl shrink-0" aria-hidden="true">{ERROR_ICONS[code]}</span>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {getErrorTitle(code)}
                  </h3>
                  <p className="text-base text-foreground leading-relaxed">
                    {info.message}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/upload"
                  className="bg-primary text-primary-foreground rounded-xl px-5 py-3 text-base font-semibold text-center hover:opacity-90 transition-opacity"
                >
                  {info.retry}
                </Link>
                <Link
                  href="/"
                  className="bg-secondary text-secondary-foreground rounded-xl px-5 py-3 text-base font-semibold text-center hover:opacity-90 transition-opacity"
                >
                  返回首页
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getErrorTitle(code: ErrorCode): string {
  const titles: Record<ErrorCode, string> = {
    unsupported_format: '文件格式不支持',
    file_too_large: '文件过大',
    image_blurry: '图片模糊',
    ocr_failed: '文字识别（OCR）失败',
    type_uncertain: '材料类型无法判断',
    ai_failed: 'AI 分析失败',
    network_error: '网络或系统错误',
    approval_number_not_found: '批准文号无法查询',
    approval_number_mismatch: '批准文号信息不一致',
    qrcode_only: '只有二维码',
    save_failed: '保存失败',
    delete_failed: '删除失败',
  };
  return titles[code];
}
