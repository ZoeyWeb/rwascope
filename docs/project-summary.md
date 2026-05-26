# RWA-Index 项目内容体系与架构总结

> 生成于 2026-05-12 | 域名：**rwa-index.com**

---

## 一、项目定位

RWA-Index 是面向 HKMA、SFC、学术研究者和机构从业者的**学术研究工具**，聚焦香港及全球真实世界资产（RWA）代币化分析。

核心合规红线：
- 不得生成任何平台评分 / 字母等级 / AI 评级
- 不得公开任何聚合分数排名
- 管理后台只展示元数据，不暴露用户的评分内容
- SARM 仅用红绿灯信号，不做加权合成

---

## 二、Repo 结构

```
rwascope/
├── backend/      ← FastAPI + SQLAlchemy（主力后端）
├── api/          ← 遗留副本，禁止编辑
├── web/          ← React + Vite + Tailwind（前端）
├── native/       ← Expo RN，休眠中，不要动
└── docs/         ← 白皮书 + 参考文档
```

---

## 三、前端模块总览（web/）

### 公开模块（无需登录）

| 模块 | 路由 | 数据文件 | 状态 |
|---|---|---|---|
| Market Dashboard | `/` | `data/leaderboard.json`（DeFiLlama cron 更新） | 已上线 |
| **M1** Licenses 牌照追踪 | `/licenses`, `/licenses/:slug` | `data/licenses/issuers.json` | 已上线 |
| **M2** Ensemble Tracker | `/ensemble`, `/ensemble/timeline`, `/ensemble/use-cases`, `/ensemble/institutions`, `/ensemble/institutions/:slug` | `data/ensemble/ensemble.json` | 已上线 |
| **M3** Assets 资产库 | `/assets`, `/assets/:slug` | `data/assets/assets.json` | 已上线 |
| **M4** Compliance Map | `/compliance`, `/compliance/:jurisdiction/:issue` | `data/compliance/matrix.json` | 已上线 |
| **M6** Incidents 事件库 | `/incidents`, `/incidents/:slug` | `data/incidents/incidents.json` | 已上线 |
| **M7** Reports 季报 | `/reports`, `/reports/:slug` | `data/reports/reports.json` | 已上线 |
| About / 方法论 | `/about`, `/methodology`, 各模块 `/methodology` | — | 已上线 |

### 私有模块（需登录/注册）

| 模块 | 路由 | 说明 |
|---|---|---|
| Due Diligence 工作本 | `/score/*` | 用户自填 RARM 评分，私有存储 |
| Self-Assessment | `/self-assessment` | 六层 RARM 自评引导 |
| Admin 后台 | `/admin/*` | 用户管理、审计日志、导出 |

---

## 四、各模块数据概要

### M1 — Licenses（HKMA 稳定币牌照，SARM）
- **8 家申请机构**，其中 2 家已获牌：HSBC（`hsbc-hkd`）、Anchorpoint Financial（`standard-chartered-animoca-hkt`）
- 6 个 SARM 维度：`capital_adequacy` / `reserve_quality` / `governance` / `technology` / `redemption` / `disclosure`
- 信号值：`green` / `yellow` / `red` / `gray`
- 聚合函数：`aggregateSARM()` 仅统计各信号数量，**不做加权**

### M2 — Ensemble Tracker（HKMA EnsembleTX）
- **5 个里程碑**（2024-03-07 → 2025-11-13）
- **7 个用例**（2 pilot in-progress, 4 sandbox completed, 1 cross-border completed）
- **10 家机构**（2 HK 监管机构、1 FR 监管机构、5 HK 银行、1 CN 科技、2 US 资管）
- 阶段颜色：pre-launch 灰 / sandbox 琥珀 / pilot 绿
- 严格数据规则：只收录 HKMA 公开披露信息

### M3 — Assets（25 个 RWA 资产，RARM）
- Green 14 个：BUIDL, BENJI, OUSG, USDY, USTB, XAUT, Centrifuge Prime, PAXG, WTGXX, HKSAR Digital Green Bond, ChinaAMC HKD Digital MMF, USYC, AUSD, OMMF
- Yellow 6 个：ACRED, RealToken, bCSPX, XGT, TBILL, USCC
- Red 3 个：TUSD, Maple Finance (Syrup), Goldfinch (FIDU)
- Gray 2 个：Hamilton Lane SCOPE, Matrixdock STBT
- RARM 聚合逻辑：任意 gray → gray；任意 red → red；≥4 green 无 red → green；其余 → yellow

### M4 — Compliance Map（5×5 矩阵）
- 司法管辖区：HK / CN / SG / US / EU（全部已填充）
- 议题：`rwa_issuance` / `stablecoin_issuance` / `vasp_licensing` / `cross_border` / `retail_access`
- 信号：`open` / `conditional` / `restricted` / `placeholder`

### M6 — Incidents（27 个事件，2022-2025）
- Global 参考 19 个（损失 ≥ $100M 或多司法管辖监管响应）
- HK 相关 8 个（JPEX、Hounax、FDUSD 等）
- 每个事件映射 SARM/RARM 框架，来源可溯

### M7 — Reports（季报）
- Q1 2026（已发布 2026-05-05）
- Q2 2026（预览版，2026-05-07）
- Section 类型：`manual` / `auto-licenses` / `auto-assets` / `auto-incidents` / `auto-market` / `mixed`
- 支持 APA / Chicago / BibTeX 引用导出 + PDF 下载（`@react-pdf/renderer`，动态导入）

---

## 五、前端技术栈

| 层 | 选型 |
|---|---|
| 框架 | React 18 + Vite + TypeScript |
| 路由 | React Router v6 |
| 样式 | Tailwind CSS（无 CSS Modules，无 styled-components）|
| 图标 | Google Material Symbols（CDN） |
| 图表 | Recharts |
| PDF | @react-pdf/renderer（动态导入） |
| 测试 | Vitest |
| Auth | JWT（Access 60min + Refresh 7d），存于 AuthContext |
| CAPTCHA | Cloudflare Turnstile |

**品牌色板：**

| Token | 色值 | 用途 |
|---|---|---|
| Primary | `#2B3437` | 正文 / 深色背景 |
| Accent | `#5E5C75` | 激活态 |
| Secondary | `#737C7F` | 次要文字 |
| Border | `#DBE4E7` | 边框 |
| Green | `#2E7D32` | 正向信号 |
| Amber | `#e09d2b` | 警示信号 |
| Red | `#9e3f4e` | 负向信号 |

**关键路径文件：**

```
web/src/
├── App.tsx                  — 路由定义
├── api/client.ts            — 所有 API 调用 + TS 类型
├── context/AuthContext.tsx  — JWT 认证状态
├── components/
│   ├── TopNav.tsx           — 顶部导航（nav items 在此维护）
│   ├── SideNav.tsx          — 侧边栏
│   ├── Layout.tsx           — Shell（SideNav + TopNav + Outlet）
│   ├── RequireAuth.tsx      — 登录守卫
│   ├── RequireAdmin.tsx     — 管理员守卫
│   ├── DisclaimerBanner.tsx — 免责声明组件（Licenses / Incidents 复用）
│   └── ReportPDF/index.tsx  — PDF 生成器
├── types/                   — 各模块 TS 类型
├── utils/
│   ├── sarm.ts              — SARM 纯函数
│   ├── rarm.ts              — RARM 纯函数
│   ├── reports.ts           — 季报聚合函数
│   ├── compliance.ts        — 合规矩阵工具函数
│   └── ensemble.ts          — Ensemble 元数据 + 工具函数
└── screens/                 — 各模块页面
```

**导航顺序（TopNav）：**
Market → Licenses → Incidents → Assets → Reports → Compliance → Ensemble → Self-assessment → Six-layer framework → Tokenization friction → Protocol Directory → Due Diligence → About

---

## 六、后端技术栈（backend/）

| 层 | 选型 |
|---|---|
| 框架 | FastAPI（async） |
| ORM | SQLAlchemy（async） |
| 数据库 | PostgreSQL 16 |
| 迁移 | Alembic |
| 设置管理 | pydantic-settings（读 `.env`）|
| 邮件 | Resend（中英双语模板） |
| 限流 | SlowAPI |
| AI | DeepSeek（仅生成尽调清单，不输出评分）|

**路由层：**

| 文件 | 职责 |
|---|---|
| `app/routers/auth.py` | 注册 / 登录 / 邮件验证 / 密码重置 |
| `app/routers/assessments.py` | 私有工作本 CRUD |
| `app/routers/admin.py` | 管理后台（需 `is_admin=True`）|
| `app/routers/public.py` | 公开统计接口 |

**数据模型：**

```
User          — 用户，含 status 状态机
DetailedAssessment — 尽调工作本（私有评分，从不聚合输出）
SubScore      — 子维度分数
AIChecklist   — DeepSeek 生成的清单
AuditLog      — 管理操作审计日志
```

**用户状态机：**
```
pending_verification → pending_review | active → rejected | suspended
```
自动审批域名：`.edu` / `.gov` / `.ac.uk` / `hkma.gov.hk` / `bis.org` / `imf.org` 等

---

## 七、生产基础设施

| 组件 | 详情 |
|---|---|
| 服务器 | AWS Lightsail，Ubuntu 24.04，`ubuntu@54.255.213.46` |
| SSH Key | `~/.ssh/lightsail.pem` |
| CDN | Cloudflare（Full SSL 模式） |
| 规范域名 | `rwa-index.com`（唯一对外域名）|
| 重定向 | `www.` / `onlyidea.net` / `www.onlyidea.net` → 301 到规范域名 |
| Nginx 根目录 | `/var/www/rwascope/`（React SPA）|
| 后端服务 | `rwascope-backend.service`（systemd），端口 8001 |
| 后端代码 | `/opt/rwascope-backend/` |
| Cron | `0 2 * * *` → `fetch_leaderboard.py`（DeFiLlama 数据）|

**架构链路：**
```
Browser → Cloudflare CDN → Nginx :443
  ├── /api/*  → uvicorn :8001 (FastAPI)
  └── /*      → /var/www/rwascope/ (React SPA, try_files → index.html)
```

**部署脚本：**
```bash
./scripts/deploy.sh            # 前端 + leaderboard 刷新（默认）
./scripts/deploy.sh all        # 前端 + 后端 + leaderboard 刷新
./scripts/deploy.sh backend    # 仅后端
./scripts/deploy.sh leaderboard  # 仅刷新 DeFiLlama 数据
```
> 注意：禁止直接用 rsync 部署前端——会覆盖 cron 维护的 `leaderboard.json`。

---

## 八、扩展规则速查

### 新增 Issuer
1. 追加到 `web/public/data/licenses/issuers.json`
2. 6 个 SARM 维度全部填写，数据不足默认 `gray`
3. `npm run build` + `./scripts/deploy.sh`

### 新增 Asset
1. 追加到 `web/public/data/assets/assets.json`
2. 6 个 RARM 层全部填写，数据不足默认 `gray`（灰色不等于负面）
3. 禁止捏造信号，有公开证据才能着色

### 新增 Incident
- Global：损失 ≥ $100M 或多司法管辖监管响应
- HK：有 HK 关联即可
- 所有数字必须有来源；有争议事项记录争议，不解析

### 新增季报
1. 追加到 `web/public/data/reports/reports.json`
2. 初始用 `status: "preview"` + `isPreview: true`，审阅后改为 `published`

### 新增合规单元格
1. 查阅一级法规 → 监管指引 → 监管登记册（按优先级）
2. 至少一个 `primary-statute` 或 `regulator-guidance` 引用才能标 `open` / `conditional`

---

*文档维护：修改各模块数据后请同步更新本文档对应章节。*
