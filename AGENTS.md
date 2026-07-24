# 银龄安心 - 项目说明

## 项目概览

「银龄安心」是一款面向老年人及其家属的用药解读与健康消费防骗网页应用。用户上传药盒、药品说明书、医院处方、保健品宣传、聊天记录等材料，系统通过 AI 工作流自动判断材料类型并进入相应分析流程。

当前为基底项目阶段，已搭建完整页面骨架和模拟数据，后续需接入 Coze 工作流替换模拟逻辑。

## 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **包管理器**: pnpm

## 目录结构

```
├── DESIGN.md              # 设计规范（适老化视觉风格）
├── src/
│   ├── app/               # 页面路由
│   │   ├── page.tsx       # 首页
│   │   ├── layout.tsx     # 全局布局（顶栏+底栏）
│   │   ├── globals.css    # 全局样式（适老化配色）
│   │   ├── upload/        # 统一上传页
│   │   ├── confirm/       # 材料分类确认页
│   │   ├── medicine/      # 药品解读结果页
│   │   ├── fraud/         # 健康消费防骗结果页
│   │   ├── comparison/    # 药品与保健品对照页
│   │   ├── family/        # 家属简报页
│   │   ├── doctor/        # 问医生清单页
│   │   ├── evidence/      # 证据整理页
│   │   ├── history/       # 历史记录页
│   │   ├── privacy/       # 隐私与使用说明页
│   │   └── error/         # 错误提示页
│   ├── components/
│   │   ├── ui/            # shadcn/ui 组件库
│   │   └── shared/        # 项目共享组件
│   │       ├── page-header.tsx   # 页面标题+返回
│   │       ├── risk-badge.tsx    # 风险等级徽章
│   │       └── safety-notice.tsx # 安全提示组件
│   ├── hooks/
│   ├── lib/
│   │   ├── types.ts       # 核心数据类型定义
│   │   ├── mock-data.ts   # 模拟数据（后续替换为真实工作流）
│   │   └── utils.ts       # 工具函数
│   └── server.ts
├── next.config.ts
├── package.json
└── tsconfig.json
```

## 构建和测试命令

- 开发：`pnpm run dev`（热更新）
- 构建：`pnpm run build`
- 启动：`pnpm run start`
- 类型检查：`pnpm ts-check`
- Lint：`pnpm lint`

## 核心数据类型

定义在 `src/lib/types.ts`：

- **Material** - 上传的材料（含类型、置信度、OCR 文字、路由）
- **Medicine** - 药品信息（名称、规格、用量、注意事项）
- **Risk** - 风险分析（等级、信号、核验步骤、需保存证据）
- **FamilyBrief** - 家属简报（材料摘要、风险等级、下一步建议）
- **DoctorQuestionList** - 问医生清单
- **EvidenceItem** - 证据整理
- **ComparisonItem** - 对照项
- **AppError** - 错误对象
- **HistoryRecord** - 历史记录

模拟数据在 `src/lib/mock-data.ts`，后续接入 Coze 工作流时替换。

## 设计规范

详见 `DESIGN.md`，核心要点：

- 适老化设计：18px 基准字号、48px 按钮高度、高对比度
- 暖棕绿主色（#2D6A4F）、暖米白背景（#FAF8F5）
- 风险等级用图标+文字+颜色三重表达（不只依赖颜色）
- 手机端单列、桌面端双列、禁止横向滚动
- 表格在移动端自动变卡片

## 后续开发指引

### 接入 Coze 工作流
- 替换 `mock-data.ts` 中的模拟数据为真实 API 调用
- 上传页接入文件存储（对象存储）
- 各结果页接入对应工作流返回数据

### UI 细化
- 可根据设计稿调整各页面组件细节
- 添加加载骨架屏（如果需要）
- 国际化（如需要）

### 知识库
- 药品信息查询可接入知识库
- 保健品备案查询

### 测试和部署
- 添加 E2E 测试
- 部署配置优化

## 编码规范

- TypeScript strict 模式，禁止隐式 any
- 函数参数和返回值必须有类型标注
- 禁止在 JSX 中直接使用 typeof window、Date.now() 等（防 Hydration 错误）
- 使用 'use client' + useEffect + useState 处理客户端逻辑
- 配置路径使用 path.resolve/__dirname，禁止硬编码绝对路径
