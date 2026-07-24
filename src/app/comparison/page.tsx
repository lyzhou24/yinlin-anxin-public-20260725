import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { MOCK_COMPARISON } from '@/lib/mock-data';

export default function ComparisonPage() {
  const comparisons = [
    { label: '产品类别', medicine_value: MOCK_COMPARISON.medicine.category, supplement_value: MOCK_COMPARISON.product.category },
    { label: '信息来源', medicine_value: MOCK_COMPARISON.medicine.source, supplement_value: MOCK_COMPARISON.product.source },
    { label: '批准文号', medicine_value: MOCK_COMPARISON.medicine.approval_number, supplement_value: MOCK_COMPARISON.product.approval_number },
    { label: '核验状态', medicine_value: MOCK_COMPARISON.medicine.verification_status, supplement_value: MOCK_COMPARISON.product.verification_status },
    { label: '生产企业', medicine_value: MOCK_COMPARISON.medicine.manufacturer, supplement_value: MOCK_COMPARISON.product.manufacturer },
    { label: '规格/剂型', medicine_value: MOCK_COMPARISON.medicine.specification, supplement_value: MOCK_COMPARISON.product.specification },
    { label: '是否诱导替代治疗', medicine_value: MOCK_COMPARISON.medicine.induce_substitution, supplement_value: MOCK_COMPARISON.product.induce_substitution },
    { label: '购买渠道', medicine_value: MOCK_COMPARISON.medicine.channel, supplement_value: MOCK_COMPARISON.product.channel },
    { label: '付款方式', medicine_value: MOCK_COMPARISON.medicine.payment, supplement_value: MOCK_COMPARISON.product.payment },
  ];

  return (
    <div>
      <PageHeader
        title="药品与保健品对照"
        subtitle="帮助判断产品身份是否清楚、宣传是否超出合理范围"
        backHref="/"
      />

      {/* 说明文案 */}
      <div className="bg-muted/50 border border-border rounded-2xl p-5 mb-6">
        <p className="text-base text-muted-foreground leading-relaxed">
          <span className="text-xl mr-1" aria-hidden="true">ℹ️</span>
          本功能不比较哪种产品疗效更好，只帮助判断产品身份是否清楚、宣传是否超出合理范围、是否存在诱导停药或异常交易风险。
        </p>
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
            {comparisons.map((item, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
                <td className="p-4 text-base font-semibold text-foreground border-b border-border/50">
                  {item.label}
                </td>
                <td className="p-4 text-base text-foreground leading-relaxed border-b border-border/50">
                  {item.medicine_value}
                </td>
                <td className="p-4 text-base text-foreground leading-relaxed border-b border-border/50">
                  {item.supplement_value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 对照卡片 - 移动端 */}
      <div className="sm:hidden space-y-4 mb-6">
        {comparisons.map((item, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5">
            <h4 className="text-lg font-bold text-foreground mb-3">{item.label}</h4>
            <div className="space-y-3">
              <div className="bg-primary/5 rounded-xl p-3">
                <span className="text-sm font-semibold text-primary">正规药品</span>
                <p className="text-base text-foreground mt-1 leading-relaxed">{item.medicine_value}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3">
                <span className="text-sm font-semibold text-red-700">推销产品</span>
                <p className="text-base text-foreground mt-1 leading-relaxed">{item.supplement_value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/family"
          className="flex-1 bg-primary text-primary-foreground rounded-xl px-8 py-4 text-xl font-semibold text-center hover:opacity-90 transition-opacity"
        >
          生成家属简报
        </Link>
        <Link
          href="/"
          className="flex-1 bg-secondary text-secondary-foreground rounded-xl px-8 py-4 text-xl font-semibold text-center hover:opacity-90 transition-opacity"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
