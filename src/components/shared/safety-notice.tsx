interface SafetyNoticeProps {
  type?: 'medical' | 'fraud' | 'general';
  className?: string;
}

const NOTICES: Record<string, { icon: string; text: string }> = {
  medical: {
    icon: '⚕️',
    text: '这些信息用来帮助您看懂药品，不能代替医生或药师。请不要自己停药、换药或改变用量。',
  },
  fraud: {
    icon: '🛡️',
    text: '本结果根据您上传的材料提示风险，不直接认定任何个人或机构实施诈骗或违法。',
  },
  general: {
    icon: 'ℹ️',
    text: '本工具只帮助整理信息，最终判断应由专业人士作出。如有疑问请咨询医生或拨打 12315。',
  },
};

export function SafetyNotice({ type = 'medical', className = '' }: SafetyNoticeProps) {
  const notice = NOTICES[type];

  return (
    <div
      className={`bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 text-amber-800 text-base leading-relaxed ${className}`}
      role="alert"
    >
      <span className="text-xl mr-2" aria-hidden="true">{notice.icon}</span>
      <strong>安全提示：</strong>{notice.text}
    </div>
  );
}
