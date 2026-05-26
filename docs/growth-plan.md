# RWA-Index Growth Plan

Last updated: 2026-05-12

---

## 目标

把 rwa-index.com 从一个内部工具成长为 HK/SG 金融监管研究圈的标准参考资源，
最终被 HKMA、SFC、学术论文和行业媒体主动引用。

---

## 一、获取用户

### 1. Newsletter（最高优先级）

- 双周发送一封 RWA 监管动态摘要
- 内容来源：Incidents 新增、Licenses 状态变更、Reports 季度更新、Compliance Matrix 更新
- 实现：用现有 Resend 集成；注册时加"订阅 Newsletter"勾选项
- 目标：把一次性访客转化为长期用户；每封邮件都是一次传播机会

### 2. LinkedIn 内容矩阵

- 每份季度报告拆成 5–6 条 LinkedIn 帖子
- 附图表截图（RARM donut、Compliance Matrix 截图等）
- 帖子末尾链接回对应模块页面
- HK/SG 金融圈以 LinkedIn 为主要信息渠道

### 3. 学术引用入口

- 在首页和各模块顶部显著位置放"How to cite this resource"
- 方法论页面提供 PDF 下载版本，方便学术引用
- 主动向 SSRN、BIS iLibrary、HKMA Working Papers 系列提交引用建议
- 在 ResearchGate / Academia.edu 发布白皮书摘要引流

### 4. 行业分发渠道

- 联系 HK Fintech Association、Web3 HK、HKIA 做内容合作
- 在监管话题相关的 Telegram/Discord 群组，有对应事件被讨论时分享 Incident 直链
  （不发广告，只在相关上下文中提供资源链接）
- 联系香港、新加坡、内地高校金融/法律系，作为课程参考资源

---

## 二、提高留存与吸引力

### 5. 来访数字展示

在首页或 About 页展示真实累计数据，作为社会证明：

- 累计访问次数 / 独立访客数（via Cloudflare Analytics，无需额外埋点）
- 数据库记录数：X incidents · X issuers · X assets · X compliance cells
- 报告下载次数（PDF 下载按钮点击埋点）
- 注册用户数（仅展示数量，不暴露任何个人信息）

实现方式：
- Cloudflare Analytics 已有流量数据，可通过 Cloudflare API 拉取展示
- 数据库统计由 `/api/stats`（新增公开端点）返回，每小时缓存一次

### 6. 数据导出（CSV / Excel）

- Incidents 列表导出
- Compliance Matrix 导出（适合研究者整理到自己的报告）
- Assets 列表导出（slug、asset name、RARM aggregate signal）
- 实现：前端直接序列化 JSON → CSV，无需后端改动

### 7. 变更通知 / Watchlist

- 用户订阅某个 Issuer 或 Asset，有数据更新时收邮件通知
- 用现有 Resend 集成实现
- 这是促进注册的最强动机之一

### 8. 全局搜索

- 横跨 Licenses + Assets + Incidents + Compliance + Ensemble 的统一搜索框
- 目前五个模块完全孤立，全局搜索大幅降低使用门槛
- 实现：前端在内存中对所有 JSON 建立倒排索引（数据量不大，可行）

### 9. 信任信号强化

- 首页加"被引用于"区域（媒体报道、学术论文、官方文件截图/链接），每次新引用都更新
- 所有数据文件显示明确的"Last updated"时间戳，让用户知道数据是活的
- 顶部 Banner 或 About 页展示方法论版本号（SARM v1.x / RARM v1.x）

---

## 三、功能扩展（中期）

### 10. API 访问（机构用户）

- 提供只读公开 API（Incidents、Assets、Compliance Matrix）
- `GET /api/public/incidents` · `GET /api/public/assets` · `GET /api/public/compliance`
- 这本身就是一个拉新卖点，吸引需要数据集成的机构用户
- 不涉及任何评分，符合合规要求

### 11. 对比视图

- Compliance Map 增加"两个司法管辖区横向对比"视图
- Assets 增加多资产并排对比（仅展示 signal，不生成评分）

---

## 四、执行优先级

| 优先级 | 事项 | 工作量 |
|---|---|---|
| P0 | Newsletter 订阅（注册流程 + Resend 模板） | 小 |
| P0 | 来访数字 / 数据统计展示（首页） | 小 |
| P1 | LinkedIn 内容发布（运营，无需开发） | 无 |
| P1 | How to cite + 方法论 PDF 下载 | 小 |
| P1 | 数据导出（CSV） | 小 |
| P2 | 全局搜索 | 中 |
| P2 | Watchlist 通知 | 中 |
| P2 | `/api/stats` 公开端点 + Cloudflare 数据展示 | 中 |
| P3 | 公开 API | 大 |
| P3 | 对比视图 | 中 |

---

## 合规提示

以上所有功能均不涉及平台生成的评分、等级或排名，符合 COMPLIANCE.md 的红线要求。
来访数字和统计展示仅展示数量（无用户内容），不涉及 SFC Type 10 风险。
