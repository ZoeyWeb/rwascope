# RWAscope — 项目功能总结

> **学术研究工具** — 提供 RARM（RWA Asset Risk Matrix）方法论框架，用于对代币化实体资产协议进行结构化尽职调查。  
> **非信贷评级服务** — 不提供信贷评级、投资建议或任何受监管的金融服务。详见 [COMPLIANCE.md](./COMPLIANCE.md)。  
> 最后更新：2026-04-21（合规改造后版本）

---

## 一、项目目标

RWAscope 是一个面向机构投资者和 DeFi 研究者的 **RWA 协议风险评估平台**。

传统 DeFi 仪表盘只展示 TVL 和价格，无法回答核心问题：  
*"这个 RWA 协议合规吗？托管安全吗？能真正赎回吗？"*

RWAscope 的目标是：

1. **方法论框架** — 提供 RARM 六层框架作为从业者自主尽调的结构化工具
2. **市场数据展示** — 接入 DeFiLlama 公开数据，展示全市场 RWA 协议的 TVL 等公开指标（无平台评分）
3. **私密尽调工作台** — 为登录用户提供子指标级打分工具，AI 辅助生成检查清单（非评分）
4. **多端覆盖** — Web 应用 + 移动 App，桌面与手机均可访问框架信息

---

## 二、主要功能

### 2.1 市场概览（Market Dashboard）

- 从 `/data/leaderboard.json` 读取真实 DeFiLlama RWA 数据，展示前 20 条协议
- 表格列：排名、协议名/Logo、资产类别、TVL、24h/7d 涨跌、审计次数（**无评分、无等级**）
- 右侧检查面板：点击协议展开官网/DeFiLlama/Etherscan 等公开信息链接
- 数据每天 02:00 UTC 由脚本自动刷新（来源标注：DeFiLlama）
- 页面顶部展示免责声明横幅

### 2.2 RARM 六层框架（Framework Methodology）

可视化展示 **RARM（RWA Asset Risk Matrix）** 评分框架：

| 层级 | 名称 | 核心评估维度 |
|------|------|-------------|
| L1 | Legal & Regulatory | 司法管辖、牌照、AML 合规 |
| L2 | Asset Valuation | 预言机质量、NAV 准确性、审计频率 |
| L3 | Custody & Security | 托管机构级别、隔离、保险、多签 |
| L4 | KYC / Counterparty | KYC 严格度、持续核查、PEP 筛查 |
| L5 | Liquidity & Market | 赎回窗口、TVL 稳定性、压力测试 |
| L6 | Settlement & Ops | 清算速度、智能合约审计、治理 |

各层权重按资产类别动态调整（政府债券 / 房地产 / 贵金属 / 私人信贷等）。

### 2.3 代币化摩擦力分析（Friction Analysis）

- 展示各资产类别在六层上的"摩擦力"热力图
- 区分 Critical / Substantial / Nominal 三档风险
- 横向比较政府债券 vs 房地产 vs 大宗商品等赛道的合规难度

### 2.4 RARM 框架概览（Self Assessment 页面）

- 以只读方式展示 RARM 六层框架的学术介绍（无交互打分）
- 提供框架引用、方法论说明
- 引导未登录用户注册以使用完整工作台
- 已登录用户跳转至 /score 尽调工作台

### 2.5 协议目录（Protocol Directory）

- 全市场 RWA 协议列表，数据来自 DeFiLlama（100+ 协议）
- 按 TVL / 协议名 / 资产类别排序；资产类别筛选；协议名搜索
- 展开行：公开信息链接（官网、DeFiLlama、Etherscan、审计报告）
- 实时统计：协议数、总 TVL（**无平台评分**）

### 2.6 用户评分系统（RWA Score）🔐

完整的登录授权 + AI 辅助评估工作流：

**① 注册 / 登录**
- 邮箱注册，JWT（access + refresh token）鉴权
- 自动 token 刷新，退出清除本地存储

**② 尽调工作表单（6 步向导）**
- Step 0：协议基本信息（名称、资产类别、描述、链）
- Step 1–6：每层展开 5–8 个子指标，用户逐项打分（0–5，初始为空需主动选择）
- 每个子指标下方有"Evidence / Rationale"文本框（可选）
- 共 33 个子指标，覆盖合规/估值/托管/KYC/流动性/结算全维度
- 提交按钮文案：「Generate Due Diligence Checklist」

**③ AI 尽调检查清单（AIReview）**
- 提交后调用 DeepSeek API 生成每层检查清单（**无 AI 评分**）
- 每层展示三栏：Verify（需验证问题）/ Sources（公开数据来源）/ Red Flags（值得关注的风险）
- 用户在清单辅助下调整自己的最终分数 + 填写证据备注
- 页面标题：「Due Diligence Checklist」

**④ 报告页（Report）**
- 报告署名：「Due Diligence Report prepared by [用户姓名]」（**非平台评级**）
- 展示用户自己的 RARM Score（私密，0–10）及分层得分条形图
- 显示用户填写的证据备注
- 展示 AI 检查清单摘要（overall_notes + suggested_public_sources）
- 页面底部法律免责声明

**⑤ 历史记录（History）**
- 列出该用户所有历史工作簿（状态：draft / checklist_generated / finalized）
- 点击跳转继续评审或查看报告；支持删除
- 底部声明：评估私密存储，不会被聚合或公开

---

## 三、技术栈

### 3.1 Web 前端（`web/`）

| 类别 | 技术 |
|------|------|
| 框架 | React 18 + Vite 5 |
| 语言 | TypeScript（strict 模式） |
| 路由 | React Router v6（嵌套路由 + ProtectedRoute） |
| 样式 | Tailwind CSS + 自定义设计系统（Material Symbols 图标） |
| 状态 | useState / useEffect + Context API（AuthContext） |
| API | 自封装 fetch client（`src/api/client.ts`） |
| 测试 | Playwright E2E（58 个测试，Chromium） |
| 构建产物 | `dist/`（单 JS bundle ~257KB gzip 75KB） |

### 3.2 移动端（`native/`）

| 类别 | 技术 |
|------|------|
| 框架 | React Native 0.74 + Expo 51 |
| 路由 | expo-router（文件系统路由） |
| 语言 | TypeScript |
| 图标 | @expo/vector-icons |
| 部署 | Expo Go 扫码预览 / EAS Build 打包 |

### 3.3 后端（`backend/`）

| 类别 | 技术 |
|------|------|
| 框架 | FastAPI 0.111（异步） |
| 语言 | Python 3.12 |
| ORM | SQLAlchemy 2.0（async）+ asyncpg |
| 数据库 | PostgreSQL 16 |
| 迁移 | Alembic |
| 鉴权 | JWT（python-jose）+ bcrypt（passlib） |
| AI | DeepSeek API（OpenAI 兼容，`openai` SDK） |
| 校验 | Pydantic v2 + pydantic-settings |
| 服务器 | uvicorn（2 workers，port 8001） |
| 反向代理 | Nginx（`rwa-index.com/api/`） |
| 进程管理 | systemd（`rwascope-backend.service`） |

### 3.4 数据脚本（`api/`）

| 类别 | 技术 |
|------|------|
| 语言 | Python 3（纯标准库，无外部依赖） |
| 数据源 | DeFiLlama `api.llama.fi/protocols`（category=RWA） |
| 输出 | `leaderboard.json`（原子写入，tmp + os.replace） |
| 调度 | Cron（每天 02:00 UTC） |

---

## 四、文件结构

```
rwascope/                          ← Monorepo 根目录
│
├── web/                           ← React Web 终端
│   ├── src/
│   │   ├── api/client.ts          ← 后端接口封装（authApi / assessmentApi）
│   │   ├── context/AuthContext.tsx← JWT 鉴权全局状态
│   │   ├── components/
│   │   │   ├── Layout.tsx         ← TopNav + SideNav + Outlet 布局
│   │   │   ├── TopNav.tsx         ← 顶部导航 + 用户头像下拉
│   │   │   ├── SideNav.tsx        ← 侧边导航 + 登录状态
│   │   │   └── RequireAuth.tsx    ← 路由守卫（未登录跳转 /login）
│   │   └── screens/
│   │       ├── MarketDashboard.tsx← 市场概览（主页）
│   │       ├── Leaderboard.tsx    ← RWA 排行榜
│   │       ├── FrameworkMethodology.tsx← 六层框架说明
│   │       ├── FrictionAnalysis.tsx   ← 摩擦力热力图
│   │       ├── SelfAssessment.tsx     ← 公开版自评估
│   │       ├── Login.tsx              ← 登录 / 注册
│   │       └── RWAScore/
│   │           ├── Form.tsx       ← 6步打分向导
│   │           ├── AIReview.tsx   ← AI 建议对比 + 调整
│   │           ├── Report.tsx     ← 最终报告
│   │           └── History.tsx    ← 历史记录
│   ├── public/data/leaderboard.json← DeFiLlama 缓存数据（每日更新）
│   ├── e2e/                       ← Playwright E2E 测试（58 个）
│   └── package.json
│
├── native/                        ← React Native 移动端
│   └── app/
│       ├── index.tsx              ← 移动版市场概览
│       ├── assessment.tsx         ← 移动版评估
│       ├── framework.tsx          ← 移动版框架
│       └── friction.tsx           ← 移动版摩擦力
│
├── backend/                       ← FastAPI 评分后端
│   ├── app/
│   │   ├── main.py                ← FastAPI 入口（CORS + 路由注册）
│   │   ├── config.py              ← 环境变量（DB / JWT / DeepSeek）
│   │   ├── database.py            ← SQLAlchemy async engine
│   │   ├── models/                ← User / DetailedAssessment / SubScore / AIReport
│   │   ├── schemas/               ← Pydantic request / response models
│   │   ├── core/
│   │   │   ├── security.py        ← JWT 生成 / 验证 / bcrypt
│   │   │   ├── deps.py            ← get_current_user FastAPI 依赖
│   │   │   └── deepseek.py        ← DeepSeek prompt 构建 + 响应解析
│   │   └── routers/
│   │       ├── auth.py            ← /register /login /refresh /me
│   │       └── assessments.py     ← CRUD + /analyze + /finalize
│   ├── alembic/versions/0001_initial.py← 数据库建表迁移
│   ├── requirements.txt
│   └── .env.example
│
├── api/                           ← 数据脚本
│   └── scripts/fetch_leaderboard.py← DeFiLlama 抓取 + RARM 打分
│
├── .gitignore                     ← 排除 node_modules / venv / .env / dist
├── README.md
└── PROJECT_SUMMARY.md             ← 本文件
```

---

## 五、使用场景

### 场景 A：机构研究员 — 快速赛道扫描
> "我需要在 30 分钟内了解当前 RWA 市场头部协议的合规质量分布"

1. 打开 `rwa-index.com` → **Market Dashboard**
2. 按 RCS 降序查看前 20 协议，点击任意协议展开六层质量条
3. 切换到 **Leaderboard** 按资产类别筛选（如"Gov. Treasuries"）
4. 对比 Paxos Gold vs BlackRock BUIDL 在 L3 托管层的得分差异

---

### 场景 B：风控团队 — 深度尽调报告
> "我们准备配置 $5M 到某 RWA 协议，需要完整风险评估报告"

1. 注册账号 → **RWA Score → New Assessment**
2. 填写协议基本信息（名称、资产类别、链）
3. 按向导完成 6 层 × 5–8 子指标打分（约 15 分钟）
4. 点击"Submit for AI Review" → DeepSeek 分析（30 秒）
5. 在 AI Review 页核查建议分数，调整有争议的子指标
6. 确认最终分数 → 生成 **PDF 级报告**（合规缺口 + 改进路线图）
7. 历史记录页存档，可随时重新查阅

---

### 场景 C：发行方 / 项目方 — 自我评估与改进
> "我们正在发行一个 RWA 协议，想了解在机构投资者眼中的合规短板"

1. 打开 **Framework Methodology** 理解六层评估维度和权重
2. 打开 **Self Assessment**（无需登录）快速自测
3. 查看 **Friction Analysis** 了解同赛道摩擦力基准
4. 注册账号完成精细版打分 → AI 生成 3–7 条**具体合规缺口**和优先级改进清单
5. 按改进路线图逐步升级合规体系（P1 优先）

---

### 场景 D：量化研究员 — 数据集成
> "我需要把 RWA 协议评分数据接入我们的内部模型"

1. 直接访问 `GET https://rwa-index.com/api/assessments/layers` 获取指标定义
2. 用 API：注册 → 登录获取 JWT → 批量提交评估 → 获取结构化 JSON 报告
3. 或直接获取静态数据：`https://rwa-index.com/data/leaderboard.json`（DeFiLlama 公开市场数据，每日更新；不含平台生成的评分）

---

### 场景 E：移动端 — 随时查阅
> "在路上想快速查看 RWA 市场动态"

1. 安装 Expo Go App，扫描开发者二维码
2. 查看移动版市场概览和框架说明
3. 支持 iOS / Android 双端

---

## 六、生产环境

| 项目 | 地址 |
|------|------|
| Web 终端（canonical） | `https://rwa-index.com` |
| 评分 API | `https://rwa-index.com/api` |
| API 文档 | `https://rwa-index.com/api/docs` |
| 健康检查 | `https://rwa-index.com/api/health` |
| Legacy 域名 | `onlyidea.net` → 301 重定向至 `rwa-index.com`（保留兼容旧链接） |
| 服务器 | AWS Lightsail · Ubuntu 24.04 · 54.255.213.46 |
| 数据库 | PostgreSQL 16（`rwascope_backend`） |
| 进程 | systemd `rwascope-backend.service`（2 workers） |
| CDN | Cloudflare（Full SSL 模式） |
| 数据更新 | Cron 每天 02:00 UTC 自动抓取 DeFiLlama |

---

## 七、API 端点速查

```
POST   /api/auth/register           注册
POST   /api/auth/login              登录（返回 JWT）
POST   /api/auth/refresh            刷新 token
GET    /api/auth/me                 当前用户信息

GET    /api/assessments/layers      获取六层子指标定义
GET    /api/assessments             我的历史评估列表
POST   /api/assessments             创建新评估
GET    /api/assessments/:id         获取评估详情
POST   /api/assessments/:id/analyze 触发 AI 分析
POST   /api/assessments/:id/finalize确认最终分数
DELETE /api/assessments/:id         删除评估
```

---

*文档由 Claude Code 自动生成，基于实际代码分析。*
