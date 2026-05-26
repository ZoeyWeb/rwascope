# UI_SPEC.md — RWAscope 四大模块前端规格

> 本文件供 Claude Code 读取，配合 CLAUDE.md v2.0 使用。
> 定义 Intelligence、Projects、Friction、Ecosystem 四个模块的信息架构、
> 叙事逻辑、组件结构、交互行为。
>
> **核心原则**：四个模块不是孤立页面，而是通过交叉跳转形成完整的探索闭环。
> 用户在任一入口都能流畅地走到其他模块。

---

## 0. 整体设计哲学

### 0.1 平台定位决定视觉风格

```
RWAscope = 机构级情报终端，不是 crypto 仪表盘

视觉参考：
  ✓ Bloomberg Terminal（密度高、信息分层、专业冷静）
  ✓ Financial Times（叙事感、编辑视角）
  ✓ PitchBook（数据结构化、深度档案）

避免：
  ✗ DeFiLlama 的彩色密集仪表盘风格
  ✗ CoinMarketCap 的零售感
  ✗ 任何 meme / 鲜艳色 / 渐变 / 阴影
```

### 0.2 三层信息密度（每个模块都要支持）

```
扫描模式（80% 用户）
  → 用户快速浏览，只看标题和关键标签
  → 设计要求：每个条目 5 秒内能判断"是否值得展开"

阅读模式（15% 用户）
  → 用户对某条信息感兴趣，展开看完整内容
  → 设计要求：展开后信息分层清晰，不堆砌

研究模式（5% 用户）
  → 用户在追踪某个主题或问题
  → 设计要求：支持筛选、关联跳转、标签订阅
```

### 0.3 跨模块跳转闭环（必须实现）

```
每个模块的内容卡片底部，至少有 2 个跨模块跳转入口。

跳转矩阵：
              → Intelligence  → Projects  → Friction  → Ecosystem
Intelligence       —             ✓           ✓          ✓
Projects           ✓             —           ✗          ✓
Friction           ✓             ✓           —          ✓
Ecosystem          ✓             ✓           ✓          —

例：
  Intelligence 事件 → 跳转"相关项目"到 Projects
  Projects 详情 → 跳转"相关政策"到 Intelligence
  Friction 红色格子 → 跳转"对应监管"到 Intelligence + "尝试中的项目"到 Projects
  Ecosystem 某层 → 跳转"该层的项目"到 Projects + "该层的监管"到 Intelligence
```

---

## 1. Intelligence 模块（/intelligence）

### 1.1 模块本质

**不是**：政策新闻列表
**而是**：RWA 行业演化叙事

用户看完应该有感受：*"原来 RWA 是这样从 2023 走到今天，下一步可能发生 X。"*

### 1.2 页面信息架构（自上而下）

```
┌────────────────────────────────────────────────┐
│ 1. Forward View 区域（顶部突出）                │
│    "Forward View · Expected Q2-Q3 2026"        │
│    内容：基于公开公告的"即将发生"事件             │
│    形式：横幅卡片，info 蓝色调                  │
│    数据：手动维护，每月编辑更新                  │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ 2. Active Narratives 区域                      │
│    标题："ACTIVE NARRATIVES"                   │
│    内容：3-5 个叙事线 pill 按钮                 │
│    例：                                         │
│      - Tokenized Treasury legitimization        │
│      - HK Stablecoin regulation                 │
│      - Bank entry into RWA                      │
│    点击 pill → 筛选时间轴只显示该叙事相关事件      │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ 3. Region Filter（地区筛选）                    │
│    Tab 切换：All / US / HK / EU / SG / UAE      │
│    样式：紧凑型 toggle group                    │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ 4. Timeline（核心区域）                         │
│    左侧竖线 + 时间节点圆点                       │
│    每个事件按时间倒序排列                        │
│    详见 1.3 单事件卡片结构                       │
└────────────────────────────────────────────────┘
```

### 1.3 单个事件卡片的三层结构

```
┌─────────────────────────────────────────────────┐
│ Header 层（始终可见）                            │
│ ─────────────────────────────────                │
│ [日期] [地区标签] [重要性标签]                    │
│ 事件标题（一句话，15px，font-weight 500）         │
│ 政策摘要（2 行，13px，secondary 色）              │
└─────────────────────────────────────────────────┘
              ↓ 点击展开
┌─────────────────────────────────────────────────┐
│ Detail 层（点击 Header 展开）                    │
│ ─────────────────────────────────                │
│ Policy → Market 因果链卡片                       │
│   ┌─────────────────────────────────┐           │
│   │ POLICY → MARKET                 │           │
│   │                                 │           │
│   │ Benefited sectors:              │           │
│   │ tokenized treasuries, on-chain  │           │
│   │ yield                           │           │
│   │                                 │           │
│   │ Affected entity types:          │           │
│   │ MMF issuers, stablecoin protos  │           │
│   │                                 │           │
│   │ Capital flow:                   │           │
│   │ DeFi stablecoins → on-chain MMF │           │
│   └─────────────────────────────────┘           │
└─────────────────────────────────────────────────┘
              ↓ 底部
┌─────────────────────────────────────────────────┐
│ Cross-module Links 层                           │
│ ─────────────────────────────────                │
│ [icon] 3 related projects（→ Projects 模块）      │
│ [icon] Ecosystem layer（→ Ecosystem 模块）        │
│ [icon] HK relevance（如有，→ HK Observation）     │
└─────────────────────────────────────────────────┘
```

### 1.4 重要性标签规则

| 标签 | 颜色 | 使用条件 |
|------|------|---------|
| `Landmark` | amber（金黄） | 改变行业格局的事件（如 BUIDL 发行、SEC 批准 MMF） |
| `Major` | gray（深灰） | 重要进展，但不改变格局 |
| `Notable` | gray（浅灰） | 值得记录但影响有限 |

### 1.5 地区标签颜色对应

```
US  → coral 浅色
HK  → blue 浅色
EU  → purple 浅色
SG  → teal 浅色
UAE → amber 浅色
全球 → gray
```

文字色用同色家族的 800 stop，避免黑色。

### 1.6 HK Observation 子路由（/intelligence/hk）

```
是 Intelligence 的子页面，不是独立模块。

页面顶部："HK Observation · 香港 RWA 监管动态分析"
说明文字："基于 RARM 六层框架分析 HKMA/SFC 政策影响"

内容：只显示 region=hk 的事件
特别字段：每条事件下方多一个"RARM 六层影响"展开区域
  L1 法规层：影响说明
  L3 托管层：影响说明
  L5 流动性层：影响说明
  （只列出受影响的层，无影响的层不显示）

频率说明：
  顶部说明文字标注："HKMA 节奏审慎，本专栏按发布周期更新，不强求频率"
  避免给用户"更新太慢"的负面印象
```

---

## 2. Projects 模块（/projects）

### 2.1 模块本质

**不是**：项目数据列表（那是 Protocol Directory 的功能）
**而是**：RWA 项目的深度档案，每个项目都是一份"解剖报告"

### 2.2 列表页（/projects）信息架构

```
┌─────────────────────────────────────────────────┐
│ 顶部筛选器                                       │
│ ─────────────────────────────────                │
│ 资产类别: [全部] [政府债券] [房地产] [商品] [信贷] │
│ 地区:    [全球] [HK] [US] [EU] [SG]              │
│ 链:      [全部] [Ethereum] [Stellar] [其他]      │
│ 状态:    [全部] [Active] [Pilot] [Announced]     │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 项目卡片网格（每行 2 个，移动端 1 个）            │
│                                                  │
│ ┌──────────────┐  ┌──────────────┐               │
│ │ [Logo] 名称  │  │ [Logo] 名称  │               │
│ │ [状态] [类别] │  │ [状态] [类别] │               │
│ │ 一句话简介   │  │ 一句话简介   │               │
│ │              │  │              │               │
│ │ RARM 概览条： │  │ RARM 概览条： │               │
│ │ ▓▓▓▓▓░░░░░  │  │ ▓▓▓▓▓▓▓░░░  │               │
│ │ 主要实体：   │  │ 主要实体：   │               │
│ │ BlackRock,   │  │ HSBC,        │               │
│ │ BNY Mellon   │  │ Hex Trust    │               │
│ └──────────────┘  └──────────────┘               │
└─────────────────────────────────────────────────┘
```

### 2.3 详情页（/projects/:slug）信息架构

按以下顺序自上而下排列：

```
┌─────────────────────────────────────────────────┐
│ 1. Breadcrumb                                   │
│    Projects > BlackRock BUIDL                   │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 2. Header                                       │
│    项目名称（22px，font-weight 500）             │
│    [Active] [Tokenized treasuries] 标签         │
│    一段简介（13-14px，secondary 色，2-3 行）      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 3. Entity Structure（实体结构图）                │
│    "ENTITY STRUCTURE"                           │
│                                                  │
│    布局：中心-外围                                │
│                                                  │
│        ┌──────────┐                              │
│        │  Issuer  │                              │
│        │BlackRock │                              │
│        └────┬─────┘                              │
│             ↓                                    │
│        ┌──────────┐                              │
│        │  Token   │                              │
│        │  BUIDL   │                              │
│        └──────────┘                              │
│                                                  │
│    支撑实体（2x3 网格）：                         │
│    [Custodian]  [Chain]    [Distributor]        │
│    [Oracle]     [Auditor]  [Regulator]          │
│                                                  │
│    实现技术要求：                                │
│    - 使用 CSS Flexbox/Grid，不引入 D3            │
│    - Token 卡片用 purple 浅色家族突出            │
│    - 其他实体卡片：白底 + 0.5px 边框              │
│    - 每个卡片可点击 → 跳转 Ecosystem 中该实体     │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 4. RARM Reference Scores                        │
│    "RARM REFERENCE SCORES · 研究参考，非平台评级"  │
│                                                  │
│    六层条形图：                                  │
│    L1 Legal      ▓▓▓▓▓▓▓▓▓░  8.5                │
│    L2 Valuation  ▓▓▓▓▓▓▓░░░  7.5                │
│    L3 Custody    ▓▓▓▓▓▓▓▓▓▓  9.2                │
│    L4 KYC        ▓▓▓▓▓▓▓░░░  7.0                │
│    L5 Liquidity  ▓▓▓▓▓▓░░░░  6.5                │
│    L6 Settlement ▓▓▓▓▓▓▓▓░░  8.0                │
│                                                  │
│    颜色规则：                                    │
│      ≥7.5 → green                                │
│      5.0-7.4 → amber                             │
│      <5.0 → red                                  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 5. Policy Linkage（政策关联）                    │
│    "RELATED POLICIES"                           │
│    列出影响该项目的 Intelligence 条目（最多 5 条） │
│    每条：[日期] 政策标题 → 跳转 Intelligence       │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 6. Cross-module Actions（底部 CTA）              │
│    并排两个按钮：                                │
│    [📅 RELATED POLICIES]  [📋 FULL DUE DILIGENCE]│
│    "SEC tokenized MMF      "Run RARM workbench ↗"│
│     approval · 2 more"                          │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 7. Data Sources（数据来源，底部）                 │
│    "SOURCES"                                    │
│    列出所有数据来源 URL（白皮书、官方公告等）       │
│    必须有，体现学术严谨性                         │
└─────────────────────────────────────────────────┘
```

### 2.4 实体结构图的视觉关键

```
DO:
  ✓ Token 节点用 purple 浅色家族高亮（c-purple 50/100）
  ✓ 其他实体用白底 + 0.5px 边框
  ✓ 用 ↓ 字符或简单 SVG 线表示关系
  ✓ 每个实体卡片可点击跳转

DON'T:
  ✗ 不用 D3、Cytoscape 等图形库（现阶段）
  ✗ 不用复杂的箭头或网络图
  ✗ 不要超过 8 个实体节点（视觉过载）
```

---

## 3. Friction 摩擦力热力图（/friction）

### 3.1 模块本质

**不是**：静态风险展示
**而是**：决策辅助工具——告诉用户"做 RWA 时哪些维度最难"

### 3.2 页面信息架构

```
┌─────────────────────────────────────────────────┐
│ 1. 顶部控制区                                    │
│                                                  │
│ 地区切换：[HK] [SG] [EU] [US]                    │
│ 时间切换：[当前] [2024] [2025] [2026]            │
│ 图例：[绿]Low [黄]Mid [红]High                   │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 2. 主热力图（矩阵）                              │
│                                                  │
│         L1   L2   L3   L4   L5   L6              │
│ Gov     绿   绿   黄   黄   绿   绿              │
│ RE      红   红   黄   红   黄   黄              │
│ Comm    黄   黄   绿   绿   黄   红              │
│ Credit  红   红   红   红   黄   黄              │
│                                                  │
│ 每个格子可点击 → 弹出 detail panel               │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 3. 编辑视角说明（"HK Reading"）                   │
│    格式：引用块样式                              │
│    内容：每月手动更新，由研究团队撰写             │
│                                                  │
│    "Private credit holds the deepest red zones │
│    in HK, reflecting cautious regulatory       │
│    posture toward non-standard assets. Gov     │
│    bonds, by contrast, have moved to green     │
│    following EnsembleTX adoption.              │
│                                                  │
│    Watch L3 custody for real estate — SFC      │
│    tokenized securities subsidiary rules may   │
│    shift it to mid within 6 months."           │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 4. Cross-module CTA                             │
│    "See projects already succeeding in         │
│     low-friction zones →"                       │
│    点击 → 跳转 Projects（筛选 RARM ≥7 的项目）   │
└─────────────────────────────────────────────────┘
```

### 3.3 格子点击弹出的 detail panel

```
点击 [房地产 × L3托管] 红色格子：

┌─────────────────────────────────────────────────┐
│ Real Estate × L3 Custody · HK                   │
│ Friction: High                                  │
│                                                  │
│ Why this is high:                               │
│ Traditional property custody requires licensed │
│ trust company status. HK currently has only X  │
│ entities with full coverage capability.         │
│                                                  │
│ Related policies:                               │
│ - SFC tokenized securities subsidiary rules    │
│   (draft)                                       │
│   → 跳转 Intelligence                            │
│                                                  │
│ Projects attempting this:                       │
│ - [RealT (US-based, exploring HK)]              │
│   → 跳转 Projects                                │
│                                                  │
│ Expected shift:                                 │
│ "Likely to mid within 6 months if SFC rules    │
│  finalize"                                      │
└─────────────────────────────────────────────────┘
```

### 3.4 颜色编码

```
Low（低摩擦）  → c-green 100 背景 + 900 文字
Mid（中摩擦）  → c-amber 100 背景 + 900 文字
High（高摩擦） → c-red 200 背景 + 900 文字

不要用纯色填充（过于刺眼），用浅色家族保持机构感
```

---

## 4. Ecosystem 生态图谱（/ecosystem）

### 4.1 模块本质

**不是**：实体目录
**而是**：行业地图，回答"亚洲 RWA 行业全景是什么样的"

### 4.2 页面信息架构

```
┌─────────────────────────────────────────────────┐
│ 1. 顶部控制区                                    │
│    地区切换：[HK] [All Asia] [SG] [UAE]          │
│    视图切换：[分层视图] [矩阵视图]（P2 阶段）      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 2. 分层堆叠地图（核心内容）                      │
│                                                  │
│ ┌────────────────────────────────────────┐      │
│ │ L1 · REGULATORS                3 active │      │
│ │ [HKMA] [SFC] [HKEX]                     │      │
│ │ 颜色：blue 浅色家族                       │      │
│ └────────────────────────────────────────┘      │
│              ↓ 监管                              │
│ ┌────────────────────────────────────────┐      │
│ │ L2 · ISSUERS                   6 active │      │
│ │ [HSBC] [Standard Chartered] [BoC HK]    │      │
│ │ [Anchorpoint] [HashKey] ...             │      │
│ │ 颜色：purple 浅色家族                     │      │
│ └────────────────────────────────────────┘      │
│              ↓ 使用                              │
│ ┌────────────────────────────────────────┐      │
│ │ L3 · INFRASTRUCTURE       Gaps marked   │      │
│ │ [Ethereum] [Chainlink] [EnsembleTX]     │      │
│ │ ⚠ Gap: no HK-recommended token standard │      │
│ │ 颜色：teal 浅色家族                       │      │
│ └────────────────────────────────────────┘      │
│              ↓ 服务                              │
│ ┌────────────────────────────────────────┐      │
│ │ L4 · SERVICES         12 active · 1 gap │      │
│ │ [Hex Trust] [HashKey Custody]           │      │
│ │ [Linklaters] [Baker McKenzie] [PwC HK]  │      │
│ │ ⚠ Gap: standardized compliance tech     │      │
│ │ 颜色：coral 浅色家族                      │      │
│ └────────────────────────────────────────┘      │
│              ↓ 支撑                              │
│ ┌────────────────────────────────────────┐      │
│ │ L5 · APPLICATIONS           Early stage │      │
│ │ [Tokenized treasuries (pilot)]          │      │
│ │ [HKD stablecoins] [Cross-border]        │      │
│ │ 颜色：pink 浅色家族                       │      │
│ └────────────────────────────────────────┘      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 3. 底部说明                                      │
│    "Click any layer to drill into entities ·    │
│     matrix view available for relationship      │
│     mapping"                                    │
└─────────────────────────────────────────────────┘
```

### 4.3 五层颜色对应（必须严格遵守）

```
L1 Regulators       → c-blue 50/100   背景 + 800 文字
L2 Issuers          → c-purple 50/100 背景 + 800 文字
L3 Infrastructure   → c-teal 50/100   背景 + 800 文字
L4 Services         → c-coral 50/100  背景 + 800 文字
L5 Applications     → c-pink 50/100   背景 + 800 文字

含义编码：
  - 监管在顶（权威）
  - 应用在底（最终落地）
  - 中间层按"上游→下游"排列
```

### 4.4 Gap 提示规则

```
每层右上角显示活跃实体数量
当层内有"行业缺口"时，底部显示 ⚠ 提示

Gap 类型：
  - 完全缺失（如"HK 标准化合规科技 缺失"）
  - 数量有限（如"本地链上审计选项有限"）
  - 待成熟（如"settlement 未规模化"）

视觉：
  - ⚠ icon + 该层对应颜色家族 600 stop
  - 字号 11.5px，不抢主内容焦点
```

### 4.5 单个实体点击行为

```
点击任意实体 pill（如 HSBC）→ 跳转到 Entity Detail 页面

Entity Detail（/ecosystem/entity/:slug）显示：
  - 实体名称、类型、地区
  - 在 RWA 领域的角色描述（叙事性短文）
  - 参与的项目列表（→ 跳转 Projects 模块）
  - 频繁搭档的其他实体（如 HSBC ↔ Linklaters）
  - 相关监管机构（如 HSBC ← HKMA）
  - 数据完整度标签（Verified / Public Sources Only / Sparse）
```

---

## 5. 跨模块跳转的具体路径定义

### 5.1 Intelligence → 其他模块

```
"3 related projects"
  → /projects?policy_id=<intelligence_id>
  → Projects 列表预筛选

"Ecosystem layer"
  → /ecosystem?highlight=<layer>
  → Ecosystem 该层高亮显示

"HK relevance"
  → /intelligence/hk?event_id=<intelligence_id>
  → HK Observation 跳转到对应事件
```

### 5.2 Projects → 其他模块

```
单个实体点击（如 BNY Mellon）
  → /ecosystem/entity/bny-mellon

"RELATED POLICIES"
  → /intelligence?project_id=<project_id>

"FULL DUE DILIGENCE"
  → /score/new?protocol=<project_slug>
  → 自动预填项目名
```

### 5.3 Friction → 其他模块

```
红色格子点击
  → 弹出 detail panel
  → panel 内有跳转链接到 Intelligence 和 Projects

"low-friction zones" CTA
  → /projects?rarm_min=7&region=<current_region>
```

### 5.4 Ecosystem → 其他模块

```
点击某层标题
  → /projects?ecosystem_layer=<layer>
  → 该层的所有项目

点击监管机构（如 HKMA）
  → /intelligence?region=hk&category=hk_observation

点击应用层项目
  → /projects/<slug>
```

---

## 6. 组件复用规范

### 6.1 共用组件

```
web/src/components/

CrossModuleLink.tsx
  ↑ 用于所有跨模块跳转按钮
  ↑ 统一样式：图标 + 标签 + 描述

RegionToggle.tsx
  ↑ Intelligence、Friction、Ecosystem 共用
  ↑ HK / SG / EU / US / UAE / All

NarrativeBadge.tsx
  ↑ 叙事线标签
  ↑ 可被多个模块引用

EntityPill.tsx
  ↑ 实体名称胶囊
  ↑ Projects、Ecosystem 共用
  ↑ 点击跳转 /ecosystem/entity/:slug

PolicyImpactCard.tsx
  ↑ Policy → Market 因果链卡片
  ↑ Intelligence 模块的核心组件

LayerBlock.tsx
  ↑ Ecosystem 的分层堆叠块
  ↑ 接收 layer / color / entities / gaps props

RarmScoreBar.tsx
  ↑ 六层条形图组件
  ↑ Projects 详情页、Report 页共用
```

### 6.2 颜色变量统一

```typescript
// web/src/lib/colors.ts

export const REGION_COLORS = {
  us:   { bg: '#FAECE7', text: '#993C1D' },  // coral
  hk:   { bg: '#E6F1FB', text: '#0C447C' },  // blue
  eu:   { bg: '#EEEDFE', text: '#3C3489' },  // purple
  sg:   { bg: '#E1F5EE', text: '#085041' },  // teal
  uae:  { bg: '#FAEEDA', text: '#854F0B' },  // amber
}

export const ECOSYSTEM_LAYER_COLORS = {
  L1_regulators:     { bg: '#E6F1FB', text: '#0C447C' },
  L2_issuers:        { bg: '#EEEDFE', text: '#3C3489' },
  L3_infrastructure: { bg: '#E1F5EE', text: '#085041' },
  L4_services:       { bg: '#FAECE7', text: '#712B13' },
  L5_applications:   { bg: '#FBEAF0', text: '#72243E' },
}

export const FRICTION_COLORS = {
  low:  { bg: '#C0DD97', text: '#173404' },
  mid:  { bg: '#FAC775', text: '#412402' },
  high: { bg: '#F09595', text: '#501313' },
}

export const SIGNIFICANCE_COLORS = {
  landmark: { bg: '#FAEEDA', text: '#854F0B' },
  major:    { bg: 'var(--color-background-secondary)', text: 'var(--color-text-secondary)' },
  notable:  { bg: 'var(--color-background-secondary)', text: 'var(--color-text-secondary)' },
}
```

---

## 7. 开发顺序建议

### Phase 1（P1，必须）

```
顺序：先把"骨架 + 单模块完整"做出来，再做跨模块跳转

Step 1: Intelligence 模块基础
  - 路由 /intelligence 创建
  - Timeline 组件（无 Forward View，无 Narratives）
  - 单事件卡片（Header + Detail 两层）
  - 录入 5-8 条真实事件数据

Step 2: Projects 模块基础
  - 路由 /projects 和 /projects/:slug
  - 列表页卡片网格
  - 详情页：Header + Entity Structure + RARM Scores
  - 录入 3-5 个深度项目档案（先 BUIDL、BENJI、OUSG）

Step 3: 跨模块跳转骨架
  - Intelligence 事件底部加 "related projects" 链接
  - Projects 详情底部加 "RELATED POLICIES" 链接
  - 即使数据不全也要先把跳转流走通
```

### Phase 2（P1，重要）

```
Step 4: Friction 升级
  - 现有热力图保留矩阵
  - 加地区切换（HK/SG/EU/US）
  - 加格子点击弹出 detail panel
  - 加 "HK Reading" 编辑视角说明

Step 5: Ecosystem 模块
  - 路由 /ecosystem
  - 五层堆叠地图
  - 每层颜色严格按规范
  - Gap 提示

Step 6: Forward View + Narratives
  - Intelligence 顶部 Forward View 区域
  - Active Narratives pill 按钮
  - 叙事筛选逻辑
```

### Phase 3（P2，优化）

```
Step 7: HK Observation 子专栏
  - /intelligence/hk 路由
  - RARM 六层影响说明

Step 8: Entity Detail 页面
  - /ecosystem/entity/:slug
  - 实体在 RWA 领域的叙事描述
  - 关联项目和搭档展示

Step 9: 矩阵视图
  - Ecosystem 切换视图：分层 ↔ 矩阵
  - 实体 × 项目矩阵
```

---

## 8. 数据准备清单（给运营/编辑团队）

开发前必须先准备以下数据：

```
Intelligence 数据（至少 10 条）
  ├─ 5 条 HK 相关事件（HKMA/SFC 实际发布过的）
  ├─ 3 条全球重大事件（SEC、MiCA、MAS）
  ├─ 2 条 Forward View 预期事件
  └─ 每条都有 Policy → Market 完整分析（手动撰写）

Projects 数据（至少 5 个深度档案）
  ├─ BlackRock BUIDL（全球头部，公开信息充分）
  ├─ Franklin Templeton BENJI
  ├─ Ondo USDY / OUSG
  ├─ 1 个 HK 相关项目
  └─ 每个项目：完整实体结构图 + RARM 参考分 + sources 列表

Friction 数据（4 资产类别 × 6 层 = 24 格）
  ├─ HK 视角矩阵（全部 24 格摩擦力评估）
  ├─ 每个红色/橙色格子的"why"说明
  ├─ 关联政策和项目的链接 ID
  └─ "HK Reading" 编辑短文（200 字左右）

Ecosystem 数据（HK 视角，至少 30 个实体）
  ├─ L1 监管层：HKMA、SFC、HKEX（3 个）
  ├─ L2 发行层：HSBC、SC、BoC HK、Anchorpoint、HashKey 等（6+）
  ├─ L3 基础设施：Ethereum、Chainlink、EnsembleTX 等
  ├─ L4 服务层：托管、律所、审计（12+）
  ├─ L5 应用层：实际运行/试点项目（3-5）
  └─ Gap 列表（每层 1-2 个）
```

---

## 9. 验收检查清单

每个模块开发完成后，验收时确认：

### Intelligence
- [ ] Forward View 区域存在且突出（顶部）
- [ ] Narrative pill 至少 3 个，点击有效
- [ ] 时间轴竖线 + 圆点视觉正确
- [ ] 单事件 Header 信息清晰，5 秒内可判断价值
- [ ] 单事件展开后 Policy → Market 卡片完整
- [ ] 跨模块跳转链接（至少 2 个）可点击
- [ ] 地区筛选有效

### Projects
- [ ] 列表页卡片网格 2 列布局
- [ ] 筛选器 4 个维度（类别/地区/链/状态）
- [ ] 详情页按规定顺序展示 7 个模块
- [ ] Entity Structure 中心-外围布局
- [ ] Token 节点 purple 高亮
- [ ] RARM 条形图颜色按 7.5/5.0 阈值变化
- [ ] DisclaimerBanner 存在
- [ ] "研究参考，非平台评级"说明显示
- [ ] Sources 列表完整可点击

### Friction
- [ ] 矩阵格子可点击
- [ ] 点击红格弹出 detail panel
- [ ] 地区切换正常
- [ ] 三档颜色用浅色家族（非饱和色）
- [ ] "HK Reading" 编辑视角说明显示
- [ ] 跨模块 CTA 跳转 Projects 有效

### Ecosystem
- [ ] 五层堆叠布局，颜色严格对应
- [ ] 每层显示活跃实体数量
- [ ] Gap 提示用 ⚠ icon + 同色 600 stop
- [ ] 实体 pill 可点击
- [ ] 地区切换正常
- [ ] 视觉层级清晰（L1 在顶，L5 在底）

---

## 10. 视觉风格底线（任何模块都必须遵守）

```
✓ 浅色家族背景 + 同色 800/900 stop 文字
✓ 0.5px 边框（不是 1px）
✓ 圆角用 var(--border-radius-md) 或 -lg
✓ 字体只用 400/500 两个 weight
✓ 句首大写，不用 Title Case，不用 ALL CAPS（除了小标签）
✓ Tabler outline icons（不用 emoji）

✗ 不用渐变、阴影、毛玻璃
✗ 不用饱和色（如纯红 #FF0000）
✗ 不用 600/700 字重
✗ 不用 D3、Cytoscape 等重型图形库（Phase 1-2）
✗ 不用花哨动画
```

---

## 11. 如何向 Claude Code 提出修改请求

### 标准模板

```
任务：修改 [模块名称] 模块的 [具体部分]

参考文档：UI_SPEC.md Section [章节号]

要求：
1. [具体要求 1]
2. [具体要求 2]
3. [具体要求 3]

数据：
[如需新数据，列出格式或来源]

跨模块影响：
[是否影响其他模块的跳转或共用组件]

验收：
对照 UI_SPEC.md Section 9 的验收清单
```

### 示例

```
任务：开发 Intelligence 模块的 Forward View 区域

参考文档：UI_SPEC.md Section 1.2 和 Section 7 Step 6

要求：
1. 在 /intelligence 页面顶部添加 Forward View 卡片
2. 使用 info 蓝色调（var(--color-background-info)）
3. 内容来自 backend API GET /api/intelligence/forward-view
4. 卡片包含：标题 "Forward View · Expected Q2-Q3 2026" + 内容列表

数据：
新增 intelligence_items 表的 is_forward_view 字段（boolean）
event_date 字段存储预期日期

跨模块影响：
无新增跨模块跳转

验收：
对照 UI_SPEC.md Section 9 Intelligence 部分第 1 项
```

---

*UI_SPEC.md 版本：v1.0
最后更新：2026-05-12
配套文档：CLAUDE.md v2.0、WORKFLOW.md v1.0*
