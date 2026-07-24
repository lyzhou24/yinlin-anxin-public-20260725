# 银龄安心（Yinling Anxin）

> 面向老年人及家庭照护者的材料识别与风险辅助理解应用。系统通过图片上传、OCR 与工作流分析，将药品说明、可疑宣传或聊天材料整理成更易读的结构化结果，并支持家庭协作查看。

**当前阶段：中期可演示版本。** 主分析链路已经接通，但真实身份认证、家庭授权、通知落库和生产安全边界尚未补齐，当前版本仅适合受控演示，不应直接作为生产系统公开部署。

## 项目简介

“银龄安心”围绕老年用户常见的“看不清、看不懂、难判断、难与家人同步”问题，提供两条核心能力：

- **药品安心看**：识别药盒或说明书，输出药品名称、用途、用法用量、禁忌、不良反应、注意事项和来源提示，并允许人工修正后保存。
- **防骗安心查**：识别可疑宣传、聊天或交易材料，给出分级风险、原文证据、停止动作和进一步核验建议。

系统同时提供老人/家属身份分流、多老人代上传、家属简报、历史记录、风险预警界面及适老化交互。核心演示链路为：

`登录与身份选择 → 选择材料所属老人 → 上传单张图片 → OCR 与分类 → 药品/防骗分析 → 保存、查看或分享结果`

## 当前完成情况

截至 **2026-07-24**，按当前代码、接口连接和构建结果审计，110 个细分检查项中 **74 项已实现、36 项未实现**。该计数不按工作量加权，也不代表生产就绪度；完整证据和验收边界见[《中期目标实现检查表》](./中期目标实现检查表.md)。

| 主要功能 | 状态 | 当前实现边界 |
|---|:---:|---|
| 身份选择、身份化首页和访问引导 | 🟡 | 页面和客户端守卫已实现；登录、身份和会话仍是演示机制 |
| 老人/家属资料与多老人代上传 | 🟡 | 交互链路已实现；资料和家庭关系尚未完整数据库化 |
| 单图选择、拍照、预览、删除、旋转和主体裁切 | ✅ | 当前仅支持单图；仍需真实移动设备和复杂背景回归 |
| 对象存储、OCR、材料分类（WF-1） | ✅ | 已接真实接口；依赖正确的对象存储与工作流环境配置 |
| 药品结构化解读、修正和保存（WF-2） | ✅ | 药品记录接口可用；权威核验和多药相互作用尚未闭环 |
| 防骗风险分级、证据与行动建议（WF-3） | ✅ | 分析和结果界面已实现；红色预警通知尚未真实落库 |
| 动态家属简报、长图/打印和三天分享 | 🟡 | 简报可生成；分享鉴权、撤销、访问审计和导出脱敏未完成 |
| 历史记录、筛选、确认和导出 | 🟡 | 药品记录和前端操作已实现；防骗记录、详情恢复和永久删除未完成 |
| 预警中心与确认操作 | 🟡 | 界面和浏览器本地确认状态已实现；通知、已读和重试未落库 |
| 适老化响应式界面 | 🟡 | 大字号、清晰层级和多通道风险表达已实现；系统无障碍验收未完成 |

## 主要 TODO

| 顺序 | 优先级 | 工作项 | 完成标准摘要 |
|---:|:---:|---|---|
| 1 | P0 | 真实账户与安全会话 | 接入真实验证码、HttpOnly 会话、退出失效、CSRF/限流和统一服务端守卫 |
| 2 | P0 | 核心数据持久化 | 用户、老人健康资料、身份和家庭关系进入数据库，移除固定模拟 ID |
| 3 | P0 | 家庭绑定状态机 | 完成一次性绑定码、老人确认/拒绝、授权、过期和撤销 |
| 4 | P0 | 逐请求权限校验 | 服务端校验操作人、材料所属老人、家庭关系和六项权限，撤权全站即时生效 |
| 5 | P0 | 预警、通知和历史闭环 | 红色预警事件、授权收件人、已读/确认、失败重试及药品/防骗历史统一落库 |
| 6 | P0 | 分享与隐私合规 | 补齐分享鉴权、最小披露、撤销、访问审计、同意记录和数据删除流程 |
| 7 | P0 | 自动化测试与生产运维 | 增加单元/接口/权限/E2E 测试，并完成迁移、监控、日志脱敏和回滚 |
| 8 | P1 | 多图与敏感信息处理 | 支持多图排序和完整分析，增加敏感文字坐标、高亮与遮挡 |
| 9 | P1 | 分析质量闭环 | 增加分类回写、权威来源核验、多药拆分、重复成分和相互作用提示 |
| 10 | P1/P2 | 扩展功能产品化 | 接通反馈复核、问医生清单、药品/保健品对照、证据包和无障碍验收 |

## 技术栈

- Next.js 16（App Router）、React 19、TypeScript 5
- Tailwind CSS 4、shadcn/ui、Radix UI
- React Hook Form、Zod
- Drizzle ORM、PostgreSQL（可选持久化）
- S3 兼容对象存储、Coze 工作流（WF-1/WF-2/WF-3）
- 自定义 Node.js 服务、tsup、pnpm 9

## 本地运行

### 环境要求

- Node.js 20+
- pnpm 9+
- Bash 环境（Windows 可使用 Git Bash 或 WSL）

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

在项目根目录创建不会提交到 Git 的 `.env.local`，按需配置：

```dotenv
COZE_TOKEN=
COZE_TOKEN_WF2=
COZE_TOKEN_WF3=
COZE_BUCKET_ENDPOINT_URL=
COZE_BUCKET_NAME=
PGDATABASE_URL=
```

其中 `COZE_TOKEN_WF2`、`COZE_TOKEN_WF3` 可分别覆盖默认 `COZE_TOKEN`；不配置 `PGDATABASE_URL` 时，当前药品记录会退化为服务进程内存储，服务重启后不保证保留。

### 3. 启动开发服务

```bash
pnpm dev
```

浏览器访问 [http://localhost:5000](http://localhost:5000)。

### 4. 质量检查与生产构建

```bash
pnpm validate
pnpm build
pnpm start
```

本次中期检查中，TypeScript 类型检查、ESLint 静态检查和生产构建均已通过；仓库目前没有可作为验收依据的自动化单元、接口或端到端测试。

## 使用边界

- 分析结果用于辅助阅读和风险提示，不替代医生、药师、公安机关或其他专业机构的正式意见。
- 当前登录、家庭绑定、权限、分享和通知部分仍含演示实现，不要上传真实敏感材料或直接开放公网访问。
- 提交代码时不得提交令牌、数据库连接串、对象存储凭据或真实个人信息。

## 项目文档

- [中期目标实现检查表](./中期目标实现检查表.md)：逐项完成状态、代码审计结论、优先级和分工。

<details>
<summary>展开查看原始脚手架开发说明（保留历史内容）</summary>

# projects

这是一个基于 [Next.js 16](https://nextjs.org) + [shadcn/ui](https://ui.shadcn.com) 的全栈应用项目，由扣子编程 CLI 创建。

## 快速开始

### 启动开发服务器

```bash
coze dev
```

启动后，在浏览器中打开 [http://localhost:5000](http://localhost:5000) 查看应用。

开发服务器支持热更新，修改代码后页面会自动刷新。

### 构建生产版本

```bash
coze build
```

### 启动生产服务器

```bash
coze start
```

## 项目结构

```
src/
├── app/                      # Next.js App Router 目录
│   ├── layout.tsx           # 根布局组件
│   ├── page.tsx             # 首页
│   ├── globals.css          # 全局样式（包含 shadcn 主题变量）
│   └── [route]/             # 其他路由页面
├── components/              # React 组件目录
│   └── ui/                  # shadcn/ui 基础组件（优先使用）
│       ├── button.tsx
│       ├── card.tsx
│       └── ...
├── lib/                     # 工具函数库
│   └── utils.ts            # cn() 等工具函数
└── hooks/                   # 自定义 React Hooks（可选）

server/
├── index.ts                 # 自定义服务器入口
├── tsconfig.json           # Server TypeScript 配置
└── dist/                    # 编译输出目录（自动生成）
```

## 核心开发规范

### 1. 组件开发

**优先使用 shadcn/ui 基础组件**

本项目已预装完整的 shadcn/ui 组件库，位于 `src/components/ui/` 目录。开发时应优先使用这些组件作为基础：

```tsx
// ✅ 推荐：使用 shadcn 基础组件
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function MyComponent() {
  return (
    <Card>
      <CardHeader>标题</CardHeader>
      <CardContent>
        <Input placeholder="输入内容" />
        <Button>提交</Button>
      </CardContent>
    </Card>
  );
}
```

**可用的 shadcn 组件清单**

- 表单：`button`, `input`, `textarea`, `select`, `checkbox`, `radio-group`, `switch`, `slider`
- 布局：`card`, `separator`, `tabs`, `accordion`, `collapsible`, `scroll-area`
- 反馈：`alert`, `alert-dialog`, `dialog`, `toast`, `sonner`, `progress`
- 导航：`dropdown-menu`, `menubar`, `navigation-menu`, `context-menu`
- 数据展示：`table`, `avatar`, `badge`, `hover-card`, `tooltip`, `popover`
- 其他：`calendar`, `command`, `carousel`, `resizable`, `sidebar`

详见 `src/components/ui/` 目录下的具体组件实现。

### 2. 路由开发

Next.js 使用文件系统路由，在 `src/app/` 目录下创建文件夹即可添加路由：

```bash
# 创建新路由 /about
src/app/about/page.tsx

# 创建动态路由 /posts/[id]
src/app/posts/[id]/page.tsx

# 创建路由组（不影响 URL）
src/app/(marketing)/about/page.tsx

# 创建 API 路由
src/app/api/users/route.ts
```

**页面组件示例**

```tsx
// src/app/about/page.tsx
import { Button } from '@/components/ui/button';

export const metadata = {
  title: '关于我们',
  description: '关于页面描述',
};

export default function AboutPage() {
  return (
    <div>
      <h1>关于我们</h1>
      <Button>了解更多</Button>
    </div>
  );
}
```

**动态路由示例**

```tsx
// src/app/posts/[id]/page.tsx
export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <div>文章 ID: {id}</div>;
}
```

**API 路由示例**

```tsx
// src/app/api/users/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ users: [] });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ success: true });
}
```

### 3. 依赖管理

**必须使用 pnpm 管理依赖**

```bash
# ✅ 安装依赖
pnpm install

# ✅ 添加新依赖
pnpm add package-name

# ✅ 添加开发依赖
pnpm add -D package-name

# ❌ 禁止使用 npm 或 yarn
# npm install  # 错误！
# yarn add     # 错误！
```

项目已配置 `preinstall` 脚本，使用其他包管理器会报错。

### 4. 样式开发

**使用 Tailwind CSS v4**

本项目使用 Tailwind CSS v4 进行样式开发，并已配置 shadcn 主题变量。

```tsx
// 使用 Tailwind 类名
<div className="flex items-center gap-4 p-4 rounded-lg bg-background">
  <Button className="bg-primary text-primary-foreground">
    主要按钮
  </Button>
</div>

// 使用 cn() 工具函数合并类名
import { cn } from '@/lib/utils';

<div className={cn(
  "base-class",
  condition && "conditional-class",
  className
)}>
  内容
</div>
```

**主题变量**

主题变量定义在 `src/app/globals.css` 中，支持亮色/暗色模式：

- `--background`, `--foreground`
- `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground`
- `--destructive`, `--destructive-foreground`
- `--border`, `--input`, `--ring`

### 5. 表单开发

推荐使用 `react-hook-form` + `zod` 进行表单开发：

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  username: z.string().min(2, '用户名至少 2 个字符'),
  email: z.string().email('请输入有效的邮箱'),
});

export default function MyForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { username: '', email: '' },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    console.log(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Input {...form.register('username')} />
      <Input {...form.register('email')} />
      <Button type="submit">提交</Button>
    </form>
  );
}
```

### 6. 数据获取

**服务端组件（推荐）**

```tsx
// src/app/posts/page.tsx
async function getPosts() {
  const res = await fetch('https://api.example.com/posts', {
    cache: 'no-store', // 或 'force-cache'
  });
  return res.json();
}

export default async function PostsPage() {
  const posts = await getPosts();

  return (
    <div>
      {posts.map(post => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  );
}
```

**客户端组件**

```tsx
'use client';

import { useEffect, useState } from 'react';

export default function ClientComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData);
  }, []);

  return <div>{JSON.stringify(data)}</div>;
}
```

## 常见开发场景

### 添加新页面

1. 在 `src/app/` 下创建文件夹和 `page.tsx`
2. 使用 shadcn 组件构建 UI
3. 根据需要添加 `layout.tsx` 和 `loading.tsx`

### 创建业务组件

1. 在 `src/components/` 下创建组件文件（非 UI 组件）
2. 优先组合使用 `src/components/ui/` 中的基础组件
3. 使用 TypeScript 定义 Props 类型

### 添加全局状态

推荐使用 React Context 或 Zustand：

```tsx
// src/lib/store.ts
import { create } from 'zustand';

interface Store {
  count: number;
  increment: () => void;
}

export const useStore = create<Store>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

### 集成数据库

推荐使用 Prisma 或 Drizzle ORM，在 `src/lib/db.ts` 中配置。

## 技术栈

- **框架**: Next.js 16.1.1 (App Router)
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **样式**: Tailwind CSS v4
- **表单**: React Hook Form + Zod
- **图标**: Lucide React
- **字体**: Geist Sans & Geist Mono
- **包管理器**: pnpm 9+
- **TypeScript**: 5.x

## 参考文档

- [Next.js 官方文档](https://nextjs.org/docs)
- [shadcn/ui 组件文档](https://ui.shadcn.com)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [React Hook Form](https://react-hook-form.com)

## 重要提示

1. **必须使用 pnpm** 作为包管理器
2. **优先使用 shadcn/ui 组件** 而不是从零开发基础组件
3. **遵循 Next.js App Router 规范**，正确区分服务端/客户端组件
4. **使用 TypeScript** 进行类型安全开发
5. **使用 `@/` 路径别名** 导入模块（已配置）

</details>
