/** 银龄安心 - 模拟数据（用于基底项目展示，后续接入 Coze 工作流后替换） */

import type {
  Material,
  Medicine,
  Risk,
  FamilyBrief,
  DoctorQuestionList,
  EvidenceItem,
  ComparisonResult,
  HistoryRecord,
  MedicineResult,
  UserAccount,
  UserProfile,
  FamilyInvite,
  FamilyRelation,
  AlertEvent,
  NotificationRecord,
} from './types';

// ===== 模拟材料 =====

export const MOCK_MATERIAL: Material = {
  material_id: 'mat_001',
  file_url: '/placeholder-medicine.jpg',
  material_type: 'medicine_leaflet',
  type_label: '药品说明书',
  confidence: 0.92,
  confidence_level: 'high',
  quality: 'good',
  ocr_text: '【药品名称】氨氯地平贝那普利片\n【规格】5mg:10mg\n【用法用量】口服，一次一片，一日一次\n【适应症】高血压\n【不良反应】头痛、头晕、咳嗽\n【禁忌】对本品任一成分过敏者禁用',
  image_description: '{"form":"药品说明书","visual_features":"折叠式纸张，小字密集排版","key_entities":["氨氯地平贝那普利片"],"has_payment_info":false,"has_qr_code":false,"has_contact_info":false}',
  missing_fields: [],
  route: 'medicine',
  authenticity_flags: {
    authenticity_level: 'needs_verification',
    authenticity_level_label: '需要核验',
    risk_signals: ['批准文号格式异常'],
    verification_suggestions: ['建议通过正规渠道进一步核验'],
  },
};

// ===== 模拟药品 =====

export const MOCK_MEDICINE: Medicine = {
  medicine_id: 'MED-M20260717001-01',
  identity_status: 'confirmed',
  drug_name: {
    material_value: '氨氯地平贝那普利片',
    catalog_value: '氨氯地平贝那普利片',
    display_value: '氨氯地平贝那普利片',
    status: 'confirmed',
    sources: [
      {
        source_id: 'MAT-M20260717001-IMG01',
        source_type: 'USER_PACKAGE',
        short_name: '来自您上传的药盒',
        location: '图片1，药品名称区域',
      },
      {
        source_id: 'SRC-002-国药准字H20090810',
        source_type: 'MEDICAL_INSURANCE_CATALOG',
        short_name: '来自医保药品目录',
        location: '医保药品代码 XA10BJB219B002010180532',
      },
    ],
  },
  specification: {
    material_value: '5mg:10mg',
    catalog_value: '5mg:10mg',
    display_value: '5mg:10mg',
    status: 'confirmed',
    sources: [
      {
        source_id: 'MAT-M20260717001-IMG01',
        source_type: 'USER_PACKAGE',
        short_name: '来自您上传的药盒',
        location: '图片1，规格区域',
      },
      {
        source_id: 'SRC-002-国药准字H20090810',
        source_type: 'MEDICAL_INSURANCE_CATALOG',
        short_name: '来自医保药品目录',
        location: '医保药品代码 XA10BJB219B002010180532',
      },
    ],
  },
  approval_number: {
    material_value: '国药准字H20090810',
    catalog_value: '国药准字H20090810',
    display_value: '国药准字H20090810',
    status: 'confirmed',
    sources: [
      {
        source_id: 'MAT-M20260717001-IMG01',
        source_type: 'USER_PACKAGE',
        short_name: '来自您上传的药盒',
        location: '图片1，批准文号区域',
      },
      {
        source_id: 'SRC-002-国药准字H20090810',
        source_type: 'MEDICAL_INSURANCE_CATALOG',
        short_name: '来自医保药品目录',
        location: '医保药品代码 XA10BJB219B002010180532',
      },
    ],
  },
  manufacturer: {
    material_value: 'XX制药有限公司',
    catalog_value: 'XX制药有限公司',
    display_value: 'XX制药有限公司',
    status: 'confirmed',
    sources: [
      {
        source_id: 'MAT-M20260717001-IMG01',
        source_type: 'USER_PACKAGE',
        short_name: '来自您上传的药盒',
        location: '图片1，生产企业区域',
      },
      {
        source_id: 'SRC-002-国药准字H20090810',
        source_type: 'MEDICAL_INSURANCE_CATALOG',
        short_name: '来自医保药品目录',
        location: '医保药品代码 XA10BJB219B002010180532',
      },
    ],
  },
  indication_from_instruction: {
    material_value: '用于治疗高血压',
    display_value: '用于治疗高血压',
    status: 'material_only',
    sources: [
      {
        source_id: 'MAT-M20260717001-IMG03-P02',
        source_type: 'USER_INSTRUCTION',
        short_name: '来自您上传的说明书',
        location: '图片3，第2页，适应症章节',
      },
    ],
  },
  dose_from_material: {
    material_value: '一次一片',
    display_value: '一次一片',
    status: 'material_only',
    sources: [
      {
        source_id: 'MAT-M20260717001-IMG03-P02',
        source_type: 'USER_INSTRUCTION',
        short_name: '来自您上传的说明书',
        location: '图片3，第2页，用法用量章节',
      },
    ],
  },
  frequency_from_material: {
    material_value: '一日一次',
    display_value: '一日一次',
    status: 'material_only',
    sources: [
      {
        source_id: 'MAT-M20260717001-IMG03-P02',
        source_type: 'USER_INSTRUCTION',
        short_name: '来自您上传的说明书',
        location: '图片3，第2页，用法用量章节',
      },
    ],
  },
  timing_from_material: {
    material_value: null,
    catalog_value: null,
    display_value: null,
    status: 'missing',
    sources: [],
    missing_message: '当前材料中未明确用药时间。',
  },
  important_warnings: {
    display_value: ['服药期间避免饮酒', '孕妇慎用'],
    status: 'material_only',
    sources: [
      {
        source_id: 'MAT-M20260717001-IMG03-P03',
        source_type: 'USER_INSTRUCTION',
        short_name: '来自您上传的说明书',
        location: '图片3，第3页，注意事项章节',
      },
    ],
  },
  contraindications: {
    display_value: ['对本品过敏者禁用'],
    status: 'material_only',
    sources: [
      {
        source_id: 'MAT-M20260717001-IMG03-P03',
        source_type: 'USER_INSTRUCTION',
        short_name: '来自您上传的说明书',
        location: '图片3，第3页，禁忌章节',
      },
    ],
  },
  adverse_reactions: {
    display_value: ['头痛、头晕', '干咳'],
    status: 'material_only',
    sources: [
      {
        source_id: 'MAT-M20260717001-IMG03-P04',
        source_type: 'USER_INSTRUCTION',
        short_name: '来自您上传的说明书',
        location: '图片3，第4页，不良反应章节',
      },
    ],
  },
  storage: {
    display_value: '遮光、密封保存',
    status: 'material_only',
    sources: [
      {
        source_id: 'MAT-M20260717001-IMG03-P04',
        source_type: 'USER_INSTRUCTION',
        short_name: '来自您上传的说明书',
        location: '图片3，第4页，贮藏章节',
      },
    ],
  },
  needs_confirmation: ['饭前还是饭后服用？'],
  source_note: '以上用法来自您上传的说明书。',
};

export const MOCK_MEDICINE_RESULT: MedicineResult = {
  risk_level: 'green',
  medicine: MOCK_MEDICINE,
};

// ===== 模拟风险 =====

export const MOCK_RISK: Risk = {
  risk_level: 'yellow',
  signals: [
    {
      category: 'claim',
      evidence_text: '宣传称"根治高血压，不用再吃药"',
      reason: '保健品不能宣称治疗疾病，这种说法违反了广告法',
      stop_action: '不要根据此宣传停掉目前的降压药',
      material_sources: ['宣传材料截图'],
      knowledge_sources: ['广告法第十八条：保健食品不得宣称治疗功能'],
    },
    {
      category: 'transaction',
      evidence_text: '要求当场转账，不走正规渠道',
      reason: '正规保健品可以通过药店或官方网店购买，不需要私人转账',
      stop_action: '不要转账给个人账户',
      material_sources: ['聊天记录截图'],
      knowledge_sources: [],
    },
    {
      category: 'product_authenticity',
      evidence_text: '产品未标注保健食品备案号或药品批准文号',
      reason: '正规保健食品应有"蓝帽子"标志和备案号，药品应有国药准字批准文号',
      stop_action: '不要购买身份不明的产品，可通过官方渠道查询备案信息',
    },
  ],
  verification_steps: [
    '在国家市场监督管理总局网站查询产品备案信息',
    '拨打产品包装上的官方电话核实',
    '到正规药店询问是否有此产品',
  ],
  evidence_to_keep: [
    '宣传材料照片或截图',
    '聊天记录截图（含对方账号信息）',
    '付款凭证或转账记录',
    '收到的产品包装照片',
  ],
};

export const MOCK_RISK_GREEN: Risk = {
  risk_level: 'green',
  signals: [],
  verification_steps: [],
  evidence_to_keep: [],
};

export const MOCK_RISK_RED: Risk = {
  risk_level: 'red',
  signals: [
    {
      category: 'identity',
      evidence_text: '对方要求提供身份证号和银行卡号办理"医保优惠"',
      reason: '正规渠道不会通过微信或电话索要身份证号和银行卡号',
      stop_action: '立即停止提供任何个人信息',
      material_sources: ['聊天记录截图'],
      knowledge_sources: [],
    },
    {
      category: 'claim',
      evidence_text: '声称"国家特批内部药，医院买不到"',
      reason: '没有"特批内部药"这种说法，这是典型的推销话术',
      stop_action: '不要购买所谓的"内部药"',
      material_sources: ['聊天记录截图'],
      knowledge_sources: [],
    },
    {
      category: 'emotion',
      evidence_text: '反复催促"今天不买就没名额了""这个优惠只有今天"',
      reason: '制造紧迫感是常见的推销手段，目的在于让人来不及思考',
      stop_action: '不要在压力下做决定，先让家里人看看',
      material_sources: ['聊天记录截图'],
      knowledge_sources: [],
    },
    {
      category: 'product_authenticity',
      evidence_text: '产品包装显示批准文号对应其他药品，信息不一致',
      reason: '包装信息与官方备案不一致，存在假冒或非法药品风险',
      stop_action: '暂停使用，保留包装，咨询正规医院或药师',
    },
  ],
  verification_steps: [
    '立即停止任何转账或付款操作',
    '不要提供验证码',
    '不要点击对方发来的链接',
    '告诉家人或拨打 12315 咨询',
  ],
  evidence_to_keep: [
    '全部聊天记录截图',
    '对方发来的所有图片和链接截图',
    '通话记录（如有电话沟通）',
    '已付款的转账凭证',
  ],
};

// ===== 模拟家属简报 =====

export const MOCK_FAMILY_BRIEF: FamilyBrief = {
  material_summary: '长辈上传了一份保健品宣传材料和微信聊天截图',
  product_or_person: '某品牌"降压灵"胶囊，推销员自称"健康管理师王老师"',
  payment_status: 'not_paid',
  payment_amount: '暂未确认',
  stop_medicine_request: true,
  personal_data_exposed: [],
  highest_risk: 'yellow',
  key_evidence: [
    '宣传材料声称"根治高血压，不用再吃药"',
    '要求通过微信转账购买，不走正规渠道',
    '催促"优惠仅限今天"',
  ],
  next_actions: [
    '建议先不要付款',
    '在国家市场监督管理总局网站查询产品备案',
    '到正规药店或医院咨询此产品',
    '不要停掉目前服用的降压药',
    '如已付款，保留好付款凭证',
  ],
};

// ===== 模拟问医生清单 =====

export const MOCK_DOCTOR_QUESTIONS: DoctorQuestionList = {
  priority_questions: [
    '目前服用的降压药是否需要调整？',
    '新提到的保健品是否可以和现在的药一起用？',
  ],
  medicine_questions: [
    '氨氯地平贝那普利片应该饭前还是饭后吃？',
    '吃药后出现干咳需要换药吗？',
    '漏服了一次怎么办？',
  ],
  supplement_questions: [
    '这款保健品有没有正规的保健食品批号（蓝帽子）？',
    '保健品和处方药同时吃会有影响吗？',
    '推销员说可以替代降压药，这种说法对吗？',
  ],
  bring_materials: [
    '目前的药品包装盒或说明书',
    '保健品宣传材料',
    '最近的血压记录',
    '其他正在服用的药物清单',
  ],
};

// ===== 模拟证据 =====

export const MOCK_EVIDENCE: EvidenceItem = {
  timeline: [
    { date: '2025年6月', event: '长辈收到微信好友推荐，添加"健康管理师王老师"' },
    { date: '7月初', event: '对方多次推送"降压灵"宣传' },
    { date: '7月中旬', event: '催促购买并要求微信转账' },
  ],
  seller: '"健康管理师王老师"（微信号未核实，无营业执照信息）',
  product_name: '"降压灵"胶囊（未查询到保健食品备案信息）',
  payment_amount: '未付款（对方报价 2980 元/疗程）',
  payment_account: '对方要求微信转账到个人账户',
  promise: '承诺"根治高血压，三个疗程停药"，承诺"无效退款"（无书面协议）',
  refund_rule: '仅口头承诺"无效退款"，无书面退款协议，无售后电话',
  saved_evidence: [
    '保健品宣传材料截图',
    '微信聊天记录部分截图',
  ],
  missing_evidence: [
    '对方完整的微信号和手机号',
    '产品包装照片（未收到实物）',
    '付款凭证（暂未付款）',
    '对方承诺退款的原话截图',
  ],
  complaint_materials: [
    '整理好的聊天记录截图',
    '宣传材料中涉嫌虚假宣传的内容标注',
    '产品名称和推销者信息',
  ],
};

// ===== 模拟对照 =====

export const MOCK_COMPARISON: ComparisonResult = {
  medicine: {
    category: '处方药（国家药品监督管理局批准）',
    source: '医院处方 + 药品说明书',
    approval_number: '国药准字H20090810',
    verification_status: 'verified',
    manufacturer: 'XX制药有限公司',
    specification: '5mg:10mg',
    induce_substitution: '未发现',
    channel: '医院或正规药店',
    payment: '医保或正规支付',
  },
  product: {
    category: '自称保健品，未查询到备案号',
    source: '微信推销员口头介绍 + 自制宣传材料',
    approval_number: '未标注',
    verification_status: 'no_info',
    manufacturer: '未明确标注生产厂家',
    specification: '胶囊，具体规格不详',
    induce_substitution: '发现（明确建议停掉降压药）',
    channel: '微信私人转账',
    payment: '微信转账到个人账户',
  },
  key_differences: [
    { level: 'red', text: '推销产品声称可替代处方药' },
    { level: 'red', text: '推销产品批准文号缺失或与官方备案不一致' },
    { level: 'yellow', text: '推销产品渠道非正规' },
    { level: 'green', text: '请继续按处方服用医院药品' },
  ],
  suggestions: {
    medicine: '继续按医嘱服用，不要自行停药。',
    product: '暂停购买并核验，不要转账付款。',
  },
};

// ===== 模拟历史记录 =====

function mockHistoryDetails(
  originalText: string,
  findings: string[],
  actions: string[],
  sources: string[]
): HistoryRecord['detail_sections'] {
  return [
    { title: '上传材料与OCR原文', items: [originalText] },
    { title: '详细分析结果', items: findings },
    { title: '建议下一步', items: actions },
    { title: '逐项信息来源', items: sources },
  ];
}

export const MOCK_HISTORY: HistoryRecord[] = [
  {
    id: 'rec_001',
    subject_user_id: 'usr_001',
    material_type: 'medicine_leaflet',
    risk_level: null,
    analyzed_at: '2025-07-10 14:30',
    summary: '氨氯地平贝那普利片说明书解读',
    thumbnail: '/file.svg',
    status: 'confirmed',
    detail_sections: mockHistoryDetails(
      '氨氯地平贝那普利片（Ⅱ），规格5mg:10mg；用法用量：每日一次，每次一片。',
      ['药品名称：氨氯地平贝那普利片（Ⅱ）', '规格：5mg:10mg', '用法用量：每日一次，每次一片', '禁忌：对本品成分过敏者禁用'],
      ['按医生处方服用，不自行增减剂量', '如出现明显头晕或持续干咳，请咨询医生'],
      ['药品名称、规格和用法来自上传说明书OCR结果', '禁忌来自上传说明书的禁忌章节']
    ),
  },
  {
    id: 'rec_002',
    subject_user_id: 'usr_001',
    material_type: 'health_promotion',
    risk_level: 'yellow',
    analyzed_at: '2025-07-09 10:15',
    summary: '保健品"降压灵"宣传材料风险分析',
    thumbnail: '/file.svg',
    status: 'pending',
    detail_sections: mockHistoryDetails(
      '宣传材料写有“一个疗程稳定血压”“配合使用可逐渐停药”，未清楚标注批准或备案信息。',
      ['宣传功效需要进一步核实', '“逐渐停药”涉及用药安全，不能按宣传材料自行执行', '产品批准或备案信息未识别清楚'],
      ['先不要依据宣传内容停用降压药', '请核对产品批准或备案信息', '携带材料咨询医生或药师'],
      ['风险判断来自宣传材料OCR原文', '待确认项来自未识别到批准或备案信息']
    ),
  },
  {
    id: 'rec_003',
    subject_user_id: 'usr_003',
    material_type: 'sales_chat',
    risk_level: 'red',
    analyzed_at: '2025-07-08 16:45',
    summary: '微信推销聊天记录高风险分析',
    thumbnail: '/file.svg',
    status: 'analyzing',
    detail_sections: mockHistoryDetails(
      '聊天内容包含“今天必须付款”“转到个人微信账户”“可以停掉原来的降压药”。',
      ['系统正在继续分析付款对象和产品身份', '已识别到催促付款、私人账户转账和停药诱导'],
      ['分析完成前先不要付款', '不要提供验证码', '不要自行停药'],
      ['初步风险来自上传聊天截图OCR结果']
    ),
  },
  {
    id: 'rec_004',
    subject_user_id: 'usr_003',
    material_type: 'hospital_prescription',
    risk_level: 'green',
    analyzed_at: '2025-07-07 09:20',
    summary: '张叔叔医院处方用药说明',
    thumbnail: '/file.svg',
    status: 'confirmed',
    detail_sections: mockHistoryDetails(
      '处方：厄贝沙坦片150mg，每日一次；阿托伐他汀钙片20mg，每晚一次。',
      ['处方涉及两种药品', '厄贝沙坦片：150mg，每日一次', '阿托伐他汀钙片：20mg，每晚一次'],
      ['严格按照处方服用', '复诊时携带处方和正在服用的药品'],
      ['药品名称和用法来自上传医院处方OCR结果']
    ),
  },
  {
    id: 'rec_005',
    subject_user_id: 'usr_001',
    material_type: 'regular_medicine',
    risk_level: null,
    analyzed_at: '2025-07-11 09:05',
    summary: '阿莫西林胶囊药盒识别',
    thumbnail: '/file.svg',
    status: 'analyzing',
    detail_sections: mockHistoryDetails(
      '阿莫西林胶囊，0.5g×24粒，国药准字H13021770。',
      ['已识别药品名称、规格和批准文号', '说明书页仍在分析中'],
      ['请等待分析完成后查看完整禁忌和用药提示'],
      ['当前信息来自上传药盒OCR结果']
    ),
  },
  {
    id: 'rec_006',
    subject_user_id: 'usr_003',
    material_type: 'payment_proof',
    risk_level: 'yellow',
    analyzed_at: '2025-07-12 18:20',
    summary: '个人账户转账凭证核验',
    thumbnail: '/file.svg',
    status: 'pending',
    detail_sections: mockHistoryDetails(
      '转账金额2680元，收款方为个人账户，备注“健康调理套餐”。',
      ['收款账户为个人账户', '付款用途与产品名称不够明确', '是否已经收货尚未确认'],
      ['请确认收款人身份和订单信息', '保留聊天记录、订单与付款凭证'],
      ['金额和收款信息来自上传付款截图OCR结果']
    ),
  },
  {
    id: 'rec_007',
    subject_user_id: 'usr_006',
    material_type: 'medicine_leaflet',
    risk_level: null,
    analyzed_at: '2025-07-13 08:40',
    summary: '二甲双胍缓释片说明书解读',
    thumbnail: '/file.svg',
    status: 'confirmed',
    detail_sections: mockHistoryDetails(
      '二甲双胍缓释片0.5g；用法：随晚餐服用；肾功能严重受损者禁用。',
      ['药品名称：二甲双胍缓释片', '规格：0.5g', '用药时间：随晚餐服用', '禁忌：肾功能严重受损者禁用'],
      ['按医生确定的剂量服用', '定期复查肾功能'],
      ['全部字段来自上传说明书OCR结果']
    ),
  },
  {
    id: 'rec_008',
    subject_user_id: 'usr_006',
    material_type: 'health_supplement',
    risk_level: 'yellow',
    analyzed_at: '2025-07-14 15:10',
    summary: '鱼油软胶囊包装信息核验',
    thumbnail: '/file.svg',
    status: 'pending',
    detail_sections: mockHistoryDetails(
      '鱼油软胶囊，净含量100粒；包装正面有“辅助降血脂”字样，备案编号照片模糊。',
      ['产品声称辅助降血脂', '备案编号需要重新拍摄确认', '不能替代处方降脂药'],
      ['重新拍摄清晰的备案编号', '服用抗凝药时先咨询医生'],
      ['产品名称和宣传语来自包装OCR结果', '备案编号因图片模糊待确认']
    ),
  },
  {
    id: 'rec_009',
    subject_user_id: 'usr_006',
    material_type: 'health_promotion',
    risk_level: 'red',
    analyzed_at: '2025-07-15 11:35',
    summary: '免费健康讲座宣传单分析',
    thumbnail: '/file.svg',
    status: 'analyzing',
    detail_sections: mockHistoryDetails(
      '宣传单写有“免费体检、现场领取特效产品、名额仅限今天”。',
      ['已识别到限时催促和“特效产品”宣传', '主办机构和产品信息仍在分析'],
      ['不要现场支付大额费用', '先让家人共同核对主办机构'],
      ['初步结论来自宣传单OCR原文']
    ),
  },
];

// ===== 模拟账户与家庭 =====

export const MOCK_USER_ACCOUNT: UserAccount = {
  user_id: 'usr_001',
  username: '王阿姨',
  phone: '138****0000',
  login_type: 'test_account',
  account_status: 'active',
  created_at: '2026-07-18T10:00:00+08:00',
  last_login_at: '2026-07-18T10:30:00+08:00',
};

export const MOCK_USER_PROFILE_ELDER: UserProfile = {
  user_id: 'usr_001',
  user_role: 'elder',
  display_name: '王阿姨',
  birth_year: 1955,
  has_chronic_disease: true,
  chronic_diseases: '高血压',
  profile_completed: true,
  allow_family_binding: true,
};

export const MOCK_USER_PROFILE_FAMILY: UserProfile = {
  user_id: 'usr_002',
  user_role: 'family',
  display_name: '小李',
  profile_completed: true,
  allow_family_binding: true,
};

export const MOCK_USER_PROFILE_ELDER_SECOND: UserProfile = {
  user_id: 'usr_003',
  user_role: 'elder',
  display_name: '张叔叔',
  birth_year: 1948,
  has_chronic_disease: false,
  profile_completed: true,
  allow_family_binding: true,
};

export const MOCK_USER_PROFILE_FAMILY_SECOND: UserProfile = {
  user_id: 'usr_004',
  user_role: 'family',
  display_name: '王女士',
  profile_completed: true,
  allow_family_binding: true,
};

export const MOCK_USER_PROFILE_CAREGIVER: UserProfile = {
  user_id: 'usr_005',
  user_role: 'family',
  display_name: '陈护工',
  profile_completed: true,
  allow_family_binding: true,
};

export const MOCK_USER_PROFILE_ELDER_THIRD: UserProfile = {
  user_id: 'usr_006',
  user_role: 'elder',
  display_name: '李奶奶',
  birth_year: 1952,
  has_chronic_disease: true,
  chronic_diseases: '2型糖尿病、高脂血症',
  profile_completed: true,
  allow_family_binding: true,
};

export const MOCK_USER_PROFILE_ELDER_BIND_SAMPLE: UserProfile = {
  user_id: 'usr_008',
  user_role: 'elder',
  display_name: '周爷爷',
  birth_year: 1950,
  has_chronic_disease: true,
  chronic_diseases: '冠心病',
  profile_completed: true,
  allow_family_binding: true,
};

export const MOCK_USER_PROFILE_FAMILY_THIRD: UserProfile = {
  user_id: 'usr_007',
  user_role: 'family',
  display_name: '赵先生',
  profile_completed: true,
  allow_family_binding: true,
};

export const MOCK_ELDER_PROFILES = [
  MOCK_USER_PROFILE_ELDER,
  MOCK_USER_PROFILE_ELDER_SECOND,
  MOCK_USER_PROFILE_ELDER_THIRD,
  MOCK_USER_PROFILE_ELDER_BIND_SAMPLE,
];

export const MOCK_FAMILY_PROFILES = [
  MOCK_USER_PROFILE_FAMILY,
  MOCK_USER_PROFILE_FAMILY_SECOND,
  MOCK_USER_PROFILE_CAREGIVER,
  MOCK_USER_PROFILE_FAMILY_THIRD,
];

export function getMockUserProfile(userId: string): UserProfile | undefined {
  return [...MOCK_ELDER_PROFILES, ...MOCK_FAMILY_PROFILES].find((profile) => profile.user_id === userId);
}

export const MOCK_FAMILY_INVITE: FamilyInvite = {
  invite_id: 'inv_001',
  elder_user_id: 'usr_001',
  invite_code: '482615',
  status: 'active',
  expires_at: '2026-07-18T10:10:00+08:00',
  used_by_user_id: undefined,
  created_at: '2026-07-18T10:00:00+08:00',
};

export const MOCK_FAMILY_BIND_SAMPLE_CODE = '731508';

export const MOCK_FAMILY_RELATION: FamilyRelation = {
  relation_id: 'rel_001',
  elder_user_id: 'usr_001',
  family_user_id: 'usr_002',
  relation_type: 'child',
  status: 'active',
  permissions: {
    receive_red_alert: true,
    view_family_report: true,
    upload_for_elder: true,
    view_history_summary: true,
    view_original_image: false,
    view_financial_details: false,
  },
  requested_at: '2026-07-18T10:05:00+08:00',
  confirmed_at: '2026-07-18T10:08:00+08:00',
};

export const MOCK_FAMILY_RELATIONS: FamilyRelation[] = [
  MOCK_FAMILY_RELATION,
  {
    relation_id: 'rel_002',
    elder_user_id: 'usr_003',
    family_user_id: 'usr_002',
    relation_type: 'relative',
    status: 'active',
    permissions: {
      receive_red_alert: true,
      view_family_report: true,
      upload_for_elder: true,
      view_history_summary: true,
      view_original_image: false,
      view_financial_details: false,
    },
    requested_at: '2026-07-18T10:12:00+08:00',
    confirmed_at: '2026-07-18T10:15:00+08:00',
  },
  {
    relation_id: 'rel_003',
    elder_user_id: 'usr_001',
    family_user_id: 'usr_004',
    relation_type: 'child',
    status: 'active',
    permissions: {
      receive_red_alert: true,
      view_family_report: true,
      upload_for_elder: false,
      view_history_summary: true,
      view_original_image: false,
      view_financial_details: false,
    },
    requested_at: '2026-07-18T10:18:00+08:00',
    confirmed_at: '2026-07-18T10:20:00+08:00',
  },
  {
    relation_id: 'rel_004',
    elder_user_id: 'usr_001',
    family_user_id: 'usr_005',
    relation_type: 'caregiver',
    status: 'active',
    permissions: {
      receive_red_alert: true,
      view_family_report: true,
      upload_for_elder: true,
      view_history_summary: false,
      view_original_image: false,
      view_financial_details: false,
    },
    requested_at: '2026-07-18T10:22:00+08:00',
    confirmed_at: '2026-07-18T10:25:00+08:00',
  },
  {
    relation_id: 'rel_005',
    elder_user_id: 'usr_006',
    family_user_id: 'usr_002',
    relation_type: 'relative',
    status: 'active',
    permissions: {
      receive_red_alert: true,
      view_family_report: true,
      upload_for_elder: true,
      view_history_summary: true,
      view_original_image: false,
      view_financial_details: false,
    },
    requested_at: '2026-07-18T10:28:00+08:00',
    confirmed_at: '2026-07-18T10:30:00+08:00',
  },
  {
    relation_id: 'rel_006',
    elder_user_id: 'usr_006',
    family_user_id: 'usr_007',
    relation_type: 'child',
    status: 'active',
    permissions: {
      receive_red_alert: true,
      view_family_report: true,
      upload_for_elder: false,
      view_history_summary: true,
      view_original_image: false,
      view_financial_details: false,
    },
    requested_at: '2026-07-18T10:32:00+08:00',
    confirmed_at: '2026-07-18T10:35:00+08:00',
  },
];

// ===== 模拟预警 =====

export const MOCK_ALERT_EVENT: AlertEvent = {
  alert_id: 'alt_001',
  subject_user_id: 'usr_001',
  material_id: 'mat_001',
  analysis_id: 'ana_001',
  family_report_id: 'rep_001',
  risk_level: 'red',
  risk_categories: ['transaction', 'claim', 'emotion'],
  evidence: [
    { quote: '可以停掉原来的降压药', source: '材料1-聊天截图' },
    { quote: '今天必须付款', source: '材料1-聊天截图' },
    { quote: '转到个人微信账户', source: '材料1-聊天截图' },
  ],
  stop_actions: ['先别付款', '不要提供验证码', '不要停掉现在吃的药', '请让家里人一起看'],
  status: 'notified',
  created_at: '2026-07-18T10:20:00+08:00',
};

export const MOCK_NOTIFICATION_RECORD: NotificationRecord = {
  notification_id: 'not_001',
  alert_id: 'alt_001',
  recipient_user_id: 'usr_002',
  channel: 'in_app',
  status: 'acknowledged',
  sent_at: '2026-07-18T10:20:05+08:00',
  read_at: '2026-07-18T10:25:00+08:00',
  acknowledged_at: '2026-07-18T10:30:00+08:00',
  retry_count: 0,
};

export const MOCK_ALERT_EVENTS_BY_ELDER: Record<string, AlertEvent> = {
  usr_001: MOCK_ALERT_EVENT,
  usr_003: {
    ...MOCK_ALERT_EVENT,
    alert_id: 'alt_002',
    subject_user_id: 'usr_003',
    material_id: 'mat_003',
    analysis_id: 'ana_003',
    family_report_id: 'rep_003',
    evidence: [
      { quote: '今天下单可以享受内部优惠', source: '材料1-宣传截图' },
      { quote: '不要告诉其他家人', source: '材料1-聊天截图' },
    ],
    stop_actions: ['先不要下单', '不要透露银行卡或验证码', '请和家人一起核实'],
    created_at: '2026-07-19T09:10:00+08:00',
  },
};

export const MOCK_NOTIFICATION_RECORDS_BY_ELDER: Record<string, NotificationRecord> = {
  usr_001: MOCK_NOTIFICATION_RECORD,
  usr_003: {
    ...MOCK_NOTIFICATION_RECORD,
    notification_id: 'not_002',
    alert_id: 'alt_002',
    status: 'sent',
    sent_at: '2026-07-19T09:10:05+08:00',
    read_at: undefined,
    acknowledged_at: undefined,
  },
};
