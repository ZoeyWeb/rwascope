# RWAscope Homepage & Content Strategy — Memory Handoff

> 用途:把 Zoey 和另一个 Claude 实例(claude.ai webchat)讨论的产品定位 + 内容策略思路,继承到 Claude Code 这边。
> 当前状态:**讨论阶段,未开始实施。**Claude Code 接手后需要先和 Zoey 对齐实际板块结构,再讨论落地方案。
> 最后更新:2026-05-20

---

## 一、本次讨论解决的问题

Zoey 当前在做 RWAscope 的主页(homepage)。讨论中她明确了两个层面的诉求:

1. **产品定位 / narrative**(已基本确立,见第二节)
2. **内容广度**(方向已定,具体方案需和 Zoey 对齐实际板块结构后再细化)

视觉升级**暂缓**——Zoey 明确说"视觉调整可以放到后一步",先把内容结构定下来。

---

## 二、产品定位:Risk Opacity → Structural Intelligence Layer

### 核心 narrative 公式(对标 Messari)

Messari 的 hero 叙事结构是三层:

1. **诊断市场失灵**("market friction caused by poor translation")
2. **命名失灵的位置**("between technical reality and institutional interpretation")
3. **把自己钉在那个位置**("Messari exists in that translation layer")

Zoey 喜欢这个结构——**先说市场坏在哪、再说我们活在哪**,而不是上来就介绍自己。

### RWAscope 的市场失灵诊断

讨论了三个候选市场失灵:

- **A. Risk Opacity(风险不透明)**——RWA 项目宣称"由现实资产支持",但 custody / SPV / 法律结构 / 对账机制都不透明
- B. Standards Fragmentation(标准碎片化)
- C. Jurisdictional Asymmetry(司法辖区信息差)

**结论:选 A。**理由:

1. A 直接对应 SARM/RARM 的学术资产(两个框架名字都有 "Resilience")
2. A 是 RWA 市场最大的存量痛点
3. B 已被 standards bodies 抢占,C 是律所/咨询领域;A 是空的,因为它需要"学术中立性 + 框架能力",商业玩家拿不到

### 关于词汇选择(重要)

讨论中考虑过几个词描述 RWAscope 的位置:

- "Verification layer" — 力量强,但有"审计"含义,可能引发"你审计过吗?"的追问
- "Decomposition layer" — 精确但过 academic
- "Transparency layer" — 安全但稍弱
- **"Structural intelligence layer"** ← **最终采用**

选择"structural intelligence layer"的理由:

1. "Structural" 直接对应 RARM 六层架构
2. "Intelligence" 而非 "verification",避免审计含义,也避开 SFC Type 10 风险
3. 这个词组在 RWA 圈目前**无人占用**,Zoey 可以定义它

### 合规护城河 + 价值主张二合一

> **"We don't rate. We don't recommend. We decompose."**

这句话:
- 对 SFC:明确的"非 Type 10"声明
- 对机构用户:暗示比 rating 更深的东西——不是给数字,是给结构
- 对媒体:极其上口、极其登报友好

### Hero 文案(Zoey 倾向版本 B + structural intelligence layer)

> **RWA promised real assets. Some delivered opacity instead.**
>
> Terra. Tangible USDR. Maple V1. Each collapsed in a different layer — peg mechanism, liquidity mismatch, credit structure. Each was visible *in retrospect*. None was visible *in advance*.
>
> Most RWA risk isn't priced — it sits in legal structures, custody chains, and reconciliation gaps that no one independently verifies. **RWAscope exists in that structural intelligence layer.**
>
> ---
>
> An independent research platform built at **HKUST Crypto-Fintech Lab**, structured around peer-reviewed risk frameworks (SARM / RARM, *Digital Finance*). We don't rate. We don't recommend. **We decompose.**

下面三个产品入口(对应已有板块):

| **Decompose** | **Benchmark** | **Learn from Failure** |
|---|---|---|
| 50 active RWA projects, mapped across 6 risk layers | Standardized comparison against SARM / RARM frameworks | 10 structured postmortems — what failed, which layer, why |

**注意:**Hero 里的"Terra. Tangible USDR. Maple V1." 三个例子选择是有逻辑的——它们分别代表 stablecoin / RWA liquidity / private credit 三个不同 asset class,且每个对应不同 RARM layer 的失败。如果 Zoey 想换,要保持这种跨 asset class + 跨 layer 的覆盖性。

### 关于香港的处理

Zoey 明确不希望"过度聚焦香港"——理由是 HKMA 太保守、香港 RWA 创新度不如新加坡/迪拜/美国,锁定香港叙事天花板低。

**结论:** 香港作为"建造地"(built at HKUST)在 hero 出现一次就够,**不要让香港成为叙事的轴心**。RWAscope 的 scope 是 global,Hong Kong 只是 regulatory observation post,不是主战场。

---

## 三、内容广度:Zoey 的核心诉求

### Zoey 的原话(关键)

> "我现在想要解决的主要问题:
> 1. 我要增加内容的广度,涉猎的方面要全一点。**而非在现有的板块下深挖。**
> 2. 网站的视觉呈现肯定要调整,但是我觉得可以放到后一步。"

她对标的网站:Messari、CoinDesk、Chainlink、RWA.xyz、Bloomberg。

她欣赏这些网站的三点:
1. 视觉呈现有美感,动态展示(动效、滚轮、视频)——**暂缓**
2. 排版有 hierarchy,主次分明(大版面+大字 vs 信息密集小版面),而非平铺卡片
3. **内容收纳做得好**——nav items 不多,但每个下面有很多子分类、子 items

### 之前的 webchat 讨论里我犯的错误(Claude Code 注意)

我在前一轮讨论里建议把内容重组成"五轴"(Projects / Entities / Markets / Frameworks / Intelligence),**但我没看到 Zoey 实际的 Projects 板块内容,把 Projects 和 Ecosystem 当成了同一个东西**。

Zoey 纠正了我:**Projects 和 Ecosystem 是两个不同的板块**。

所以**那个五轴方案需要根据她实际的板块结构重新审视**,不能直接套用。

### Claude Code 接手后的第一步(重要)

**不要直接给方案。先做这两件事:**

1. **读一下当前 nav 实际有哪些板块**,以及 Projects 和 Ecosystem 各自的内容是什么——确认它们的实际定位和差异
2. **和 Zoey 对齐"内容广度"的方向**——她说的"涉猎的方面要全一点"具体是指什么:
   - 是想增加更多板块(顶层 nav)?
   - 还是想在现有每个板块下增加更多子页面?
   - 还是想增加新的数据维度(比如按实体、按时间、按资产类别浏览)?

### 之前讨论里提到过的内容广度方向(参考,不是结论)

webchat 那边讨论时,我提了几个可能的内容广度方向(基于对 Zoey schema 的理解,但**没看到她 Projects 实际板块的样子**):

- **Entity 维度暴露**:她 schema 里有 `entity_map` (issuer / custodian / chain / oracle / law_firm / auditor / regulator),已经是结构化数据,如果作为独立浏览维度暴露,内容广度立刻翻倍
- **Asset class 横向聚合**:8 个资产类别如果每个都有 landing page,机构访客和媒体的常用入口
- **Timeline 横向视图**:她每个项目都有 `timeline: [{date, event, type}]`,但没有跨项目的统一时间线
- **Glossary**:RWA 术语词典,登报+SEO+学术权威三合一,需要 Zoey 亲自审

**这些只是讨论的候选方向,具体哪个落地、怎么落地,需要 Claude Code 看完实际板块结构后和 Zoey 一起决定。**

### Zoey 欣赏的"内容收纳"模式(具体怎么做)

她特别提到 Messari/CoinDesk 的 nav 收纳风格:

- 顶层 nav 项不多(5-6 个)
- 每个 nav 项 hover/click 展开 dropdown,里面有 5-10 个子页面
- 每个子页面是独立 landing page,有 editorial header(不是纯模板生成)

她目前的 dropdown 配置(v3 文档里):
- Intelligence: HK Observation / Incidents / Reports
- Market: Overview / Protocols
- Framework: SARM / RARM
- Ecosystem: Single Region / Compare / Global Network

**目测每个 dropdown 的子项数量偏少**,可以考虑在保持 5 个顶层 nav 的前提下,把每个 dropdown 扩展到 6-8 个子项。但具体怎么扩,要等 Claude Code 和 Zoey 看完实际板块再讨论。

---

## 四、本次讨论的"硬约束"(Claude Code 接手后必须遵守)

1. **不要做视觉升级**——Zoey 明确说后一步再做
2. **不要重新发明 narrative**——hero 文案已基本敲定,如果改要先问 Zoey
3. **不要把香港做成主轴**——HK 只是 built-at 出现一次
4. **不要使用 "rate / recommend / verification" 这类有合规含义的词**——SFC Type 10 风险
5. **不要假设 Projects 和 Ecosystem 是同一个东西**——它们是分开的板块
6. **不要奉承,不要长篇大论**——直接给 Zoey 选项让她选
7. **保持学术 + 机构感**,不要 crypto-native 语气

---

## 五、给 Claude Code 的具体操作建议

### 第一步:和 Zoey 对齐现状

问她(用她偏好的简洁风格):

> 我先看一下当前的 nav 结构和各板块内容,然后我们对齐三个问题:
> 1. Projects 板块和 Ecosystem 板块各自的定位是什么?现在各自有多少内容?
> 2. 你说的"内容广度"具体是想增加新板块(顶层 nav)、新子页面(dropdown 内)、还是新数据维度(横向聚合)?
> 3. 是先做 homepage hero(承载 narrative),还是先做内容广度扩展(承载收纳),还是并行?

### 第二步:看完她的回答,再做下面任何一件事

- 写 homepage 代码
- 提建议
- 给 plan

**不要跳过第一步。**

### 第三步:如果 Zoey 确认要做内容广度扩展

按"低成本高 ROI"顺序提建议,但**先列候选清单让她选**,不要直接做。可参考的候选(不是定论):

| 候选 | 工作量 | 内容广度增益 | Zoey 资本对齐 |
|---|---|---|---|
| Entities 维度暴露 | 低(后端 aggregate) | 高 | RARM 的 entity_map 直接对应 |
| Asset class landing pages | 中 | 中 | 8 个类别已有数据 |
| Glossary | 中(需 Zoey 写) | 高 | PhD 文献直接转化 |
| Cross-project Timeline | 低(后端 aggregate) | 中 | Schema 已有 timeline 字段 |
| Reading List / Citations | 低 | 中 | PhD 资本直接展示 |

---

## 六、对 Zoey 工作风格的提醒(继承自 v3 memory)

- 中文回复,代码/术语保英文
- **简洁**,不要长篇大论
- **不要奉承,要纠正错误**
- 分步走,不要一锅粥
- 给方案前先理清问题
- 一次只让 Claude Code 做一件事
- 让 Claude Code 先 report 不让它直接 fix,除非已确认方案
- 部署命令:`./push-and-deploy.sh "描述"`

---

## 七、本次 webchat 讨论的关键判断(供 Claude Code 参考)

1. **Zoey 真正的护城河不是数据量,是"peer-reviewed framework + 学术中立性"**——任何商业玩家短期复制不了
2. **Postmortem 的 10 个失败案例是她最独特的资产**——Messari / RWA.xyz / Bloomberg 都没有,因为他们和 issuer 有商业关系。这是 hero narrative 的弹药
3. **不要做"评级",但要做"结构化披露"**——decompose 而非 rate,既合规又比 rating 更有学术深度
4. **内容广度的 ROI 排序:存量数据的多维度暴露 > 新写内容**——她 schema 已经富,前端没暴露完
5. **视觉问题是真实的,但顺序在内容之后**——Zoey 自己的判断,不要质疑这个顺序

---

End of memory. Claude Code 接手后请先做第五节"第一步",再做任何 implementation。
