import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { MOCK_COMPARISON } from '@/lib/mock-data';
import type { ComparisonProduct } from '@/lib/types';

export default function ComparisonPage() {
  const { medicine, product, key_differences, suggestions } = MOCK_COMPARISON;

  const rows: { label: string; medicineKey: keyof ComparisonProduct; productKey: keyof ComparisonProduct }[] = [
    { label: '产品类别', medicineKey: 'category', productKey: 'category' },
    { label: '信息来源', medicineKey: 'source', productKey: 'source' },
    { label: '批准文号', medicineKey: 'approval_number', productKey: 'approval_number' },
    { label: '批准文号核验', medicineKey: 'verification_status', productKey: 'verification_status' },
    { label: '生产企业', medicineKey: 'manufacturer', productKey: 'manufacturer' },
    { label: '规格/剂型', medicineKey: 'specification', productKey: 'specification' },
    { label: '是否诱导替代治疗', medicineKey: 'induce_substitution', productKey: 'induce_substitution' },
    { label: '购买渠道', medicineKey: 'channel', productKey: 'channel' },
    { label: '付款方式', medicineKey: 'payment', productKey: 'payment' },
  ];

  return (
    <div>
      <PageHeader
        title="药品与推销产品对比"
        subtitle="同时看医院开的药和推销的产品，直观对比差异"
        backHref="/"
      />

      {/* 说明文案 */}
      <div className="bg-muted/50 border border-border rounded-2xl p-5 mb-6">
        <p className="text-base text-muted-foreground leading-relaxed">
          <span className="text-xl mr-1" aria-hidden="true">ℹ️</span>
          本功能只比较产品身份、宣传范围、替代治疗风险和交易渠道，不比较“哪一种疗效更好”。
        </p>
      </div>

      {/* 并排对照卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* 左侧：正规药品 */}
        <div className="bg-card border-2 border-primary/30 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-primary mb-4">💊 正规药品</h3>
          <div className="space-y-3">
            {rows.map((row) => (
              <CompareRow
                key={row.label}
                label={row.label}
                value={medicine[row.medicineKey]}
                highlight={row.medicineKey === 'verification_status' ? 'green' : undefined}
              />
            ))}
          </div>
        </div>

        {/* 右侧：推销产品 */}
        <div className="bg-card border-2 border-red-300 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-red-700 mb-4">⚠️ 推销产品</h3>
          <div className="space-y-3">
            {rows.map((row) => (
              <CompareRow
                key={row.label}
                label={row.label}
                value={product[row.productKey]}
                highlight={row.productKey === 'verification_status' ? 'red' : undefined}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 关键差异高亮 */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <h3 className="text-xl font-bold text-foreground mb-4">🔍 关键差异</h3>
        <div className="space-y-3">
          {key_differences.map((item, i) => (
            <div
              key={i}
              className={`rounded-xl p-4 border ${
                item.level === 'red'
                  ? 'bg-red-50 border-red-200'
                  : item.level === 'yellow'
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-green-50 border-green-200'
              }`}
            >
              <p
                className={`text-base font-semibold leading-relaxed ${
                  item.level === 'red'
                    ? 'text-red-700'
                    : item.level === 'yellow'
                    ? 'text-amber-700'
                    : 'text-green-700'
                }`}
              >
                {item.level === 'red' ? '🛑' : item.level === 'yellow' ? '⚠️' : '✅'} {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 当前建议 */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-6 mb-6">
        <h3 className="text-xl font-bold text-primary mb-4">👉 当前建议</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 border border-primary/20">
            <h4 className="font-semibold text-primary mb-2">正规药品</h4>
            <p className="text-base text-foreground">{suggestions.medicine}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-red-200">
            <h4 className="font-semibold text-red-700 mb-2">推销产品</h4>
            <p className="text-base text-foreground">{suggestions.product}</p>
          </div>
        </div>
      </div>

      {/* 对照表格 - 桌面端 */}
      <div className="hidden sm:block bg-card border border-border rounded-2xl overflow-hidden mb-6">
        <table className="w-full">
          <thead>
            <tr className="bg-primary/5">
              <th className="text-left p-4 text-base font-semibold text-foreground border-b border-border w-1/5">
                对比项
              </th>
              <th className="text-left p-4 text-base font-semibold text-primary border-b border-border">
                正规药品
              </th>
              <th className="text-left p-4 text-base font-semibold text-red-700 border-b border-border">
                推销产品
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.label} className={i % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
                <td className="p-4 text-base font-semibold text-foreground border-b border-border/50">
                  {row.label}
                </td>
                <td className="p-4 text-base text-foreground leading-relaxed border-b border-border/50">
                  {medicine[row.medicineKey]}
                </td>
                <td className="p-4 text-base text-foreground leading-relaxed border-b border-border/50">
                  {product[row.productKey]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/medicine"
          className="flex-1 bg-secondary text-secondary-foreground rounded-xl px-8 py-4 text-xl font-semibold text-center hover:opacity-90 transition-opacity"
        >
          返回药品结果
        </Link>
        <Link
          href="/fraud"
          className="flex-1 bg-secondary text-secondary-foreground rounded-xl px-8 py-4 text-xl font-semibold text-center hover:opacity-90 transition-opacity"
        >
          返回防骗结果
        </Link>
        <Link
          href="/family"
          className="flex-1 bg-primary text-primary-foreground rounded-xl px-8 py-4 text-xl font-semibold text-center hover:opacity-90 transition-opacity"
        >
          生成家属简报
        </Link>
      </div>
      <Link
        href="/"
        className="mt-4 block w-full bg-muted text-foreground rounded-xl px-8 py-4 text-xl font-semibold text-center hover:opacity-90 transition-opacity"
      >
        返回首页
      </Link>
    </div>
  );
}

function CompareRow({ label, value, highlight }: { label: string; value: string; highlight?: 'green' | 'red' }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 pb-3 border-b border-border/50 last:border-0 last:pb-0">
      <span className="text-muted-foreground text-base shrink-0 sm:w-32">{label}：</span>
      <span className={`text-base leading-relaxed ${
        highlight === 'green' ? 'text-green-700 font-semibold' :
        highlight === 'red' ? 'text-red-700 font-semibold' :
        'text-foreground'
      }`}>
        {value}
      </span>
    </div>
  );
}
