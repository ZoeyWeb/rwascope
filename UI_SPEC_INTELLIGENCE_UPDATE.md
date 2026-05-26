# UI_SPEC_INTELLIGENCE_UPDATE.md — Intelligence 模块扩展规格

> 本文件是 UI_SPEC.md Section 1 的扩展补丁。
> 配合 CLAUDE.md v2.0、UI_SPEC.md v1.0 使用。
> 仅修改 Intelligence 模块（/intelligence），其他模块不受影响。
>
> **本次更新目标**：解决 Intelligence 内容稀疏问题。
> 采取三个并行策略：扩大事件源池、Dashboard 首页布局、编辑短评。

---

## 0. 修改概述

| 变更项 | 原版本 | 新版本 |
|--------|--------|--------|
| 事件源类型 | 仅监管事件 | 5 类事件（监管/机构/项目/研究/数据） |
| 首页布局 | 单一时间轴 | Dashboard 多板块 |
| 编辑视角 | 无 | 每周一条 Editor's Note |
| 数据快照 | 无 | 时间轴内嵌入数据动态 |

---

## 1. 事件源池扩展（核心改动）

### 1.1 五类事件定义

```
event_type 字段新增枚举值，覆盖 5 种类型：

1. regulation （监管事件）
   原有类型，保留
   例：HKMA 新规、SEC 批准、MiCA 生效

2. institutional （机构事件）
   新增，频率高
   例：BlackRock 发布新产品、HSBC 加入 EnsembleTX、
       某律所发布 RWA 法律意见书

3. project （项目里程碑）
   新增，数据自动 + 人工
   例：BUIDL TVL 突破 $5B、某项目跨链扩展、
       某项目完成融资

4. research （研究报告）
   新增，定期更新
   例：BIS RWA 报告、IMF tokenization 论文、
       四大会计师事务所白皮书

5. data_milestone （数据里程碑）
   新增，自动从 DeFiLlama 检测
   例：全球 RWA TVL 突破 $20B、
       Tokenized Treasury 月增 +15%、
       亚洲占比首次超过 15%
```

### 1.2 数据库变更

```sql
-- intelligence_items 表新增字段
ALTER TABLE intelligence_items ADD COLUMN event_type VARCHAR(20)
  DEFAULT 'regulation';
-- 取值：regulation / institutional / project / research / data_milestone

ALTER TABLE intelligence_items ADD COLUMN is_data_snapshot BOOLEAN
  DEFAULT false;
-- true 表示是数据快照（视觉上紧凑展示）

ALTER TABLE intelligence_items ADD COLUMN source_entity VARCHAR(100);
-- 事件来源实体（如 'BlackRock' / 'HKMA' / 'BIS'）
-- 用于显示来源标签
```

### 1.3 视觉区分（事件类型标签）

```
每个事件 Header 左上角，地区标签旁边新增 event_type 标签：

regulation       → [📋 Policy]      → 灰色
institutional    → [🏛 Institution]  → purple 浅色
project          → [📦 Project]     → teal 浅色
research         → [📄 Research]    → blue 浅色
data_milestone   → [📊 Data]        → amber 浅色

实现：使用 Tabler icons + 同色家族 50/100 背景 + 800 文字
```

### 1.4 五类事件数据来源

```
1. regulation
   人工录入 + Cron 爬虫（fetch_intelligence.py）
   来源：HKMA / SFC / SEC / MiCA / MAS 等官方

2. institutional
   人工录入为主
   来源：机构官网公告、Reuters、Bloomberg、Financial Times
   建议关注列表：
     BlackRock、Franklin Templeton、HSBC、JPMorgan、
     Citi、Standard Chartered、BNY Mellon、State Street

3. project
   半自动：DeFiLlama 数据自动 + 人工标注重要里程碑
   触发条件：TVL 跨越阈值、新链上线、重大事件

4. research
   人工录入
   来源关注列表：
     BIS、IMF、World Bank、OECD、
     PwC / Deloitte / EY / KPMG 的 RWA 报告、
     CoinDesk Indices、Galaxy Research

5. data_milestone
   完全自动，从 DeFiLlama 数据触发
   触发规则（写入 backend/scripts/generate_data_milestones.py）：
     - 全球 TVL 跨越整数关口（$10B / $20B / $50B / $100B）
     - 某资产类别月增长 >10%
     - 某协议 TVL 跨越 $1B / $5B / $10B
     - 链分布变化（如 Ethereum 占比首次跌破 80%）
```

---

## 2. Dashboard 首页布局（核心改动）

### 2.1 新页面结构（替换原有单一时间轴）

```
路由不变：/intelligence
组件文件：web/src/screens/Intelligence/IntelligenceHome.tsx
布局：Dashboard 网格风格

┌─────────────────────────────────────────────────────┐
│ Page Header                                          │
│ "Global RWA Intelligence"                            │
│ 副标题："Policy · Institutions · Projects · Data"    │
└─────────────────────────────────────────────────────┘

┌──────────────────────────┬──────────────────────────┐
│ Block A: 本周重大事件      │ Block B: Forward View    │
│ (Highlights · 3 条)       │ (即将发生)               │
│                          │                          │
│ 紧凑列表，按 significance │ 横幅卡片，info 蓝色      │
│ 排序，只显示标题+地区+日期 │ 列出 Q2/Q3 预期事件      │
└──────────────────────────┴──────────────────────────┘

┌──────────────────────────┬──────────────────────────┐
│ Block C: Active Narratives│ Block D: 地区热度         │
│ (活跃叙事线)              │ (30 天事件数)             │
│                          │                          │
│ 5 个 pill 按钮            │ 水平条形图               │
│ 每个右侧显示 "+N" 本周    │ US ████████ 8           │
│ 新增事件数                │ HK ██████ 6              │
│                          │ EU ████ 4                │
│                          │ SG ███ 3                 │
└──────────────────────────┴──────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Block E: Editor's Note (每周一条编辑短评)            │
│                                                      │
│ 引用块样式，serif 字体可选                            │
│ 详见 Section 3                                       │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Block F: Full Timeline (完整时间轴)                  │
│                                                      │
│ 筛选器：[All] [Policy] [Institution] [Project]      │
│         [Research] [Data]                            │
│ 地区切换：[All] [US] [HK] [EU] [SG] [UAE]            │
│                                                      │
│ 时间轴（紧凑模式）                                    │
│ 数据快照（is_data_snapshot=true）用紧凑样式          │
└─────────────────────────────────────────────────────┘
```

### 2.2 Block 详细规格

#### Block A: 本周重大事件

```typescript
// 数据：取最近 7 天，significance='landmark' 或 'major' 的事件，最多 3 条
// 按 event_date DESC 排序

样式：
  容器：背景 var(--color-background-primary)，0.5px 边框，radius-lg，padding 1rem
  标题："本周重大事件" / "This Week's Highlights"
  每条：
    日期(12px secondary) · 地区标签 · 标题(14px 500)
    点击 → 滚动到 Block F 对应事件并展开

行高紧凑：每条 32-40px 高度
```

#### Block B: Forward View

```typescript
// 数据：is_forward_view=true 的事件，按 event_date ASC 排序

样式：
  容器：背景 var(--color-background-info)，radius-lg，padding 14px 16px
  顶部图标：ti-arrow-forward-up
  标签："Forward View · Expected Q2-Q3 2026"
  内容：
    每条事件一行，前面带 [Q2] / [Q3] 时间标签
    用 · 分隔，紧凑展示

颜色：info 蓝色家族
```

#### Block C: Active Narratives

```typescript
// 数据：narrative_threads 表（新增表，见 Section 4）
// 取 status='active' 的叙事，最多 5 条

样式：
  标题："ACTIVE NARRATIVES"（11px secondary，letter-spacing 0.4px）
  Pill 按钮网格：每个 pill 显示
    叙事名称 + "+N"（本周新增事件数）
  例：
    "Tokenized Treasury legitimization  +3"
    "HK Stablecoin regulation           +2"
  点击 → 时间轴筛选只显示该叙事相关事件
```

#### Block D: 地区热度

```typescript
// 数据：过去 30 天事件按 region 分组计数

样式：
  标题："REGION ACTIVITY · 30 DAYS"
  水平条形图：
    US  ████████ 8
    HK  ██████ 6
    EU  ████ 4
    SG  ███ 3
    UAE ██ 2

  最大值条 100% 宽，其他按比例
  条形颜色：每个地区用对应颜色家族（见 UI_SPEC.md Section 1.5）
  点击地区 → 时间轴筛选该地区
```

#### Block F: Full Timeline 改动

```typescript
事件类型筛选 Tab（新增）：
  [All] [Policy] [Institution] [Project] [Research] [Data]
  
紧凑模式（默认）：
  is_data_snapshot=true 的事件用一行显示
  其他事件保留 Header + 可展开 Detail
  
完整模式（用户切换）：
  所有事件展开 Detail 显示
  
视觉：is_data_snapshot 事件的样式区分：
  背景：var(--color-background-secondary) 浅色
  无 Detail 层（点击不展开）
  圆点改为方块 ▪ 与普通圆点 ● 区分
  字号比正常事件小（12.5px vs 14px）
```

---

## 3. Editor's Note（编辑短评）

### 3.1 模块本质

每周一条短评，把零散事件串成叙事，让用户感受"平台有人在思考"。

### 3.2 数据库

```sql
CREATE TABLE editor_notes (
  id UUID PRIMARY KEY,
  week_label VARCHAR,         -- 例：'Week 16 · 2026'
  published_at TIMESTAMP,
  title VARCHAR,              -- 短标题（可选，10-15 字）
  content TEXT NOT NULL,      -- 短评正文，建议 80-150 字
  related_event_ids UUID[],   -- 关联的 intelligence_items
  author VARCHAR DEFAULT 'RWAscope Research',
  created_at TIMESTAMP
);
```

### 3.3 视觉规格

```
位置：Dashboard 的 Block E
组件：web/src/screens/Intelligence/EditorNote.tsx

样式：
  容器：背景 var(--color-background-secondary)，radius-lg，
        padding 1rem 1.25rem
  
  顶部装饰：
    左侧 4px 宽 amber 色竖条（border-left）
    注意：UI_SPEC.md Section 10 提到"single-sided borders 不用圆角"
    所以容器整体 radius=0 或者 amber 条单独做
    
  标题区：
    标签："EDITOR'S NOTE · WEEK 16 · 2026"（11px secondary，
          letter-spacing 0.4px，uppercase）
    标题（可选）：14px font-weight 500
    
  正文：
    字体可选 var(--font-serif) 增强编辑感
    14px，line-height 1.7
    color var(--color-text-secondary)
    
  底部：
    "Related: 3 events"（small link，点击高亮时间轴对应事件）
    "— RWAscope Research"（署名，12px tertiary）
```

### 3.4 内容生成方式

```
现阶段：人工撰写（你或研究团队）
  每周日发布上周短评
  150 字以内
  把当周 3-5 条事件串成一个叙事观点

未来（P3）：AI 辅助
  DeepSeek 基于本周事件生成初稿
  人工审核后发布
  prompt 模板放在 backend/app/core/deepseek.py
```

### 3.5 短评示例（给运营参考）

```
EDITOR'S NOTE · WEEK 16 · 2026

合规基础设施加速成熟

本周三条事件呈现同一趋势：HKMA 发放首批稳定币牌照、
SEC 批准首个 tokenized MMF、SFC 持牌 VATP 达 12 家。
三条线同步推进——预示 Q3 将是 RWA 机构采用的关键窗口。
值得关注的是，BlackRock 在同期低调扩展 BUIDL 至新链，
这或许不是巧合。

Related: 4 events
— RWAscope Research
```

---

## 4. Active Narratives 数据结构

### 4.1 数据库

```sql
CREATE TABLE narrative_threads (
  id UUID PRIMARY KEY,
  slug VARCHAR UNIQUE,              -- 例：'tokenized-treasury-legitimization'
  name VARCHAR NOT NULL,            -- 显示名
  description TEXT,                 -- 叙事说明
  status VARCHAR DEFAULT 'active',  -- active / archived
  color VARCHAR,                    -- 用于 pill 颜色（可选）
  related_event_ids UUID[],         -- 关联的 intelligence_items
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- 关联表（多对多）
CREATE TABLE intelligence_narrative_map (
  intelligence_id UUID REFERENCES intelligence_items,
  narrative_id UUID REFERENCES narrative_threads,
  PRIMARY KEY (intelligence_id, narrative_id)
);
```

### 4.2 初始叙事数据（5 条）

```
1. Tokenized Treasury Legitimization
   美债 tokenization 从实验到合规化
   关联事件：Ondo OUSG、BlackRock BUIDL、SEC MMF 批准等

2. HK Stablecoin Regulation
   HK 稳定币监管体系建立
   关联事件：Stablecoins Ordinance、HSBC 牌照等

3. Bank Entry into RWA
   传统银行进入 RWA 赛道
   关联事件：EnsembleTX、JPMorgan、Citi 等

4. Cross-border Settlement
   跨境结算 tokenization
   关联事件：mBridge、HKMA-MAS 合作等

5. Real Estate Tokenization
   房地产 tokenization 演进
   关联事件：RealT、Propy、地方监管动态
```

---

## 5. API 端点（新增和修改）

### 5.1 新增

```python
# Dashboard 数据聚合（一次请求，多块数据）
GET /api/intelligence/dashboard
  返回：
    {
      "highlights": [...],         // 本周 3 条
      "forward_view": [...],       // 预期事件
      "narratives": [...],         // 活跃叙事 + 本周新增数
      "region_activity": {...},    // 30 天地区分布
      "editor_note": {...},        // 最新短评
      "recent_timeline": [...]     // 完整时间轴前 20 条
    }
  
GET /api/intelligence/narratives
  返回所有 active narratives 列表
  
GET /api/intelligence/narratives/:slug
  返回单个 narrative 的所有关联事件（用于筛选视图）
  
GET /api/intelligence/editor-notes
  返回最近 4 周的 editor notes（用于历史查看）
  
POST /api/intelligence/editor-notes
  创建新短评（管理员）
  
GET /api/intelligence/data-milestones
  返回最近 30 天的数据快照事件
```

### 5.2 修改

```python
# 现有 GET /api/intelligence 增加筛选参数
GET /api/intelligence?
    event_type=regulation,institutional&  # 多选，逗号分隔
    region=hk,us&
    narrative_id=<uuid>&
    is_data_snapshot=false&
    limit=50&
    offset=0
```

---

## 6. 自动化数据脚本

### 6.1 新增脚本：generate_data_milestones.py

```
位置：backend/scripts/generate_data_milestones.py
调度：每天 03:00 UTC（紧接 leaderboard.json 更新后）

逻辑：
  1. 读取最新的 leaderboard.json
  2. 与昨天的数据对比，检测：
     - 全球总 TVL 跨越关口（$10B/$20B/$50B/$100B）
     - 某协议 TVL 跨越 $1B/$5B/$10B
     - 某协议周增长率 >10%
     - 资产类别分布变化（>2 个百分点）
  3. 检测到触发条件 → 生成 intelligence_items
     - event_type='data_milestone'
     - is_data_snapshot=true
     - source_entity='DeFiLlama'
     - significance 根据规模决定（landmark/major/notable）

Cron：
  0 3 * * * python3 /home/ubuntu/rwascope/backend/scripts/generate_data_milestones.py
```

### 6.2 修改：fetch_intelligence.py

```
现有逻辑保留，新增：
  - 扩展爬取来源（加入 BIS、IMF、四大会计师事务所 RWA 报告）
  - 对爬取结果分类，自动判断 event_type
    - URL 含 'sec.gov' / 'hkma.gov.hk' → regulation
    - URL 含主要银行域名 → institutional
    - URL 含 'bis.org' / 'imf.org' → research
  - 所有爬取结果默认 status='pending'，需人工审核后才上线
```

### 6.3 新增脚本：generate_weekly_editor_note_draft.py

```
位置：backend/scripts/generate_weekly_editor_note_draft.py
调度：每周日 06:00 UTC

逻辑：
  1. 收集本周所有 published 的 intelligence_items
  2. 调用 DeepSeek，使用以下 prompt 生成短评草稿：

prompt = """
你是 RWAscope 研究团队编辑。基于以下本周 RWA 相关事件，撰写一条
80-150 字的编辑短评。要求：

1. 提炼一个统一的主题或趋势
2. 串联 2-4 条关键事件
3. 给出一个有价值的观察或预判
4. 客观、专业，避免"建议"、"应该"等措辞
5. 不构成投资建议

本周事件：
{events_summary}

输出 JSON：
{
  "title": "短标题（10-15 字，可选）",
  "content": "正文 80-150 字",
  "related_event_ids": [事件 ID 列表]
}
"""

  3. 保存为 editor_notes 表记录，status='draft'
  4. 发送邮件提醒到 admin 邮箱：'本周短评草稿待审核'
  5. 人工审核后改 status='published' 才会显示
```

---

## 7. 开发步骤（按顺序）

### Step 1：数据库迁移

```bash
cd backend
alembic revision --autogenerate -m "add_event_types_narratives_editor_notes"
# 检查生成的迁移文件
alembic upgrade head
```

确认变更：
- [ ] intelligence_items 新增 event_type / is_data_snapshot / source_entity 字段
- [ ] 新增 narrative_threads 表
- [ ] 新增 intelligence_narrative_map 关联表
- [ ] 新增 editor_notes 表

### Step 2：录入初始数据

```
初始 narratives（5 条）：人工录入
初始 events（≥30 条）：从过去 6 个月真实事件回填
  - 至少 5 条 institutional 类型
  - 至少 3 条 research 类型
  - 至少 5 条 data_milestone（手动生成历史快照）
首条 editor_note：手动撰写最近一周的短评
```

### Step 3：后端 API

```
顺序：
  1. 实现 GET /api/intelligence/dashboard（聚合接口）
  2. 实现 GET /api/intelligence/narratives
  3. 实现 GET /api/intelligence/editor-notes
  4. 修改现有 GET /api/intelligence 加筛选参数
```

### Step 4：前端 Dashboard 布局

```
顺序：
  1. 重构 IntelligenceHome.tsx 为 Dashboard 网格布局
  2. 实现 6 个 Block 组件：
     - HighlightsBlock.tsx
     - ForwardViewBlock.tsx
     - NarrativesBlock.tsx
     - RegionActivityBlock.tsx
     - EditorNoteBlock.tsx
     - TimelineBlock.tsx（改造现有时间轴）
  3. 实现事件类型筛选 Tab
  4. 实现 is_data_snapshot 的紧凑显示样式
```

### Step 5：自动化脚本

```
顺序：
  1. 实现 generate_data_milestones.py
  2. 修改 fetch_intelligence.py 加事件分类
  3. 实现 generate_weekly_editor_note_draft.py
  4. 配置 Cron
```

### Step 6：测试与验收

```
E2E 测试更新：
  web/e2e/intelligence.spec.ts 新增以下场景：
  - Dashboard 6 个 Block 都正确加载
  - 事件类型筛选有效
  - 地区筛选有效
  - 叙事筛选有效
  - 数据快照样式区分明显
  - Editor's Note 正确显示
```

---

## 8. 验收检查清单

### 数据层
- [ ] 5 种 event_type 都有真实事件录入（≥3 条/类型）
- [ ] 5 条初始 narratives 已创建并关联事件
- [ ] ≥1 条 editor_note 已发布
- [ ] data_milestones 自动生成机制可用

### Dashboard 布局
- [ ] Block A 本周事件 ≤3 条，紧凑显示
- [ ] Block B Forward View 蓝色 info 配色正确
- [ ] Block C Narratives 5 个 pill，含 "+N" 计数
- [ ] Block D 地区热度水平条，颜色按地区
- [ ] Block E Editor's Note 引用块样式
- [ ] Block F Timeline 支持事件类型筛选

### 视觉规范
- [ ] event_type 标签颜色按规范（灰/purple/teal/blue/amber）
- [ ] is_data_snapshot 事件样式区分明显（背景+方块+字号小）
- [ ] 整体保持机构终端感（无饱和色、无渐变阴影）
- [ ] DisclaimerBanner 仍然显示

### 跨模块跳转
- [ ] 事件 → Projects 跳转保留
- [ ] 事件 → Ecosystem 跳转保留
- [ ] 叙事筛选不影响跨模块跳转

### 自动化
- [ ] generate_data_milestones.py 已配置 Cron
- [ ] generate_weekly_editor_note_draft.py 已配置 Cron
- [ ] 草稿审核流程文档化（避免未审核内容上线）

---

## 9. 给 Claude Code 的执行模板

```
任务：扩展 Intelligence 模块（解决内容稀疏问题）

参考文档：UI_SPEC_INTELLIGENCE_UPDATE.md

执行顺序：
  Step 1: 数据库迁移（Section 7 Step 1）
  Step 2: 我会手动录入初始数据，先不要做
  Step 3: 实现后端 API（Section 7 Step 3）
  Step 4: 重构前端 Dashboard 布局（Section 7 Step 4）
  Step 5: 实现自动化脚本（Section 7 Step 5）
  Step 6: E2E 测试

开始前确认：
  1. CLAUDE.md v2.0 已读
  2. UI_SPEC.md v1.0 已读
  3. WORKFLOW.md v1.0 已读
  4. 此扩展文档 UI_SPEC_INTELLIGENCE_UPDATE.md 已读

遇到问题：
  对照 Section 8 验收清单逐项检查
  Editor's Note 的具体内容由我提供，不要 AI 编造
  数据快照阈值如不确定，先用文档中的默认值
```

---

*文档版本：UI_SPEC_INTELLIGENCE_UPDATE v1.0
最后更新：2026-05-12
适用范围：仅 Intelligence 模块（/intelligence）
后续合并：稳定运行 1 个月后，并入 UI_SPEC.md Section 1*
