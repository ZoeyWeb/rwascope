# RWAscope — Dev Status
_Last updated: 2026-05-06_

---

## 项目基本信息

| 项目 | 详情 |
|---|---|
| 正式域名 | `rwa-index.com`（唯一标准 URL） |
| 服务器 | AWS Lightsail · Ubuntu 24.04 · `54.255.213.46` |
| CDN | Cloudflare（Full SSL，自签名证书在服务器端） |
| SSH 密钥 | `~/.ssh/lightsail.pem` |
| 前端根目录 | `/var/www/rwascope/` |
| 后端服务 | systemd `rwascope-backend.service`，port 8001 |
| 后端代码 | `/opt/rwascope-backend/` |
| 数据库 | PostgreSQL 16，`rwascope_backend` |
| GitHub | https://github.com/ZoeyWeb/rwascope |

---

## 基础设施状态

| 组件 | 状态 | 备注 |
|---|---|---|
| Nginx 域名迁移 | ✅ 完成（2026-05-03） | `onlyidea.net`、`www.onlyidea.net`、`raterwa.onlyidea.net` 全部 301 → `rwa-index.com` |
| `www.rwa-index.com` | ✅ 已配置 301 | DNS 指向 Cloudflare，nginx server block 正确 |
| `onlyidea.net` DNS | 已删除 Cloudflare proxy | 用户浏览器缓存清除后将无法访问 |
| API health | ✅ `{"status":"ok","version":"2.0.0"}` | |
| Nginx 旧配置备份 | `/etc/nginx/sites-available/onlyidea.bak.20260503` | 可随时回滚 |

---

## 代码库清理（2026-05-03 完成）

| 操作 | 说明 |
|---|---|
| 删除 `api/` | 旧版付费后端（含 Stripe/subscription/platform scores），已废弃 |
| 删除 `web/gap-analysis.md` | 描述已废弃架构的死亡文档（2026-04-13 生成） |
| 删除 `USER.md`、`HEARTBEAT.md` | OpenClaw 空模板文件 |
| 更新 `CLAUDE.md` | Compliance Map 章节从"10 placeholder cells remaining"更新为全部 25 格已填 |

---

## 模块状态

### Module 1 — Stablecoin License Tracker ✅（v1.1，HSBC + Anchorpoint 三层已填）

- 路由：`/licenses`、`/licenses/:slug`、`/licenses/methodology`
- 数据：`web/public/data/licenses/issuers.json`，6 家发行商
- **已获牌照**：HSBC（`hsbc-hkd`）、Anchorpoint Financial（`standard-chartered-animoca-hkt`）— 2026-04-10 HKMA 发牌
- **申请中**：JD Coinlink、RD InnoTech、Circle、First Digital Trust
- **2026-05-05 更新**：两家已获牌照 issuer 的 Reserve Quality / Redemption / Governance 三个维度由 gray 升级为彩色信号，每维度附 3 条 evidence sources：
  - HSBC：reserve_quality `green`、redemption `green`、governance `green`
  - Anchorpoint：reserve_quality `green`、redemption `yellow`（B2B2C 分发路径细节待披露）、governance `green`
- **待做**：其余 4 家申请中 issuer（JD Coinlink、Round Dollar、Circle、First Digital）profile 扩充；Q1 2026 报告发布

### Module 2 — EnsembleTX Monitor ✅（v1，等 HKMA 数据）

- 路由：`/ensemble` 及子路由
- 数据：`web/public/data/ensemble/ensemble.json`
- 最新里程碑：2025-11-13（EnsembleTX 发布）
- **待做**：等 HKMA Q2/Q3 2026 阶段性 review report 发布后更新

### Module 3 — Tokenised Asset Risk Observatory ✅（v1，待填充）

- 路由：`/assets`、`/assets/:slug`、`/assets/methodology`
- 数据：`web/public/data/assets/assets.json`，8 个种子资产
- **当前状态**：全部 RARM 层为 gray（无发明评估，合规正确）
- **待做**：对有足够公开证据的资产填入真实 RARM 信号（BUIDL、OUSG 等优先）

### Module 4 — Cross-Border Compliance Map ✅（完整）

- 路由：`/compliance` 及子路由
- 数据：`web/public/data/compliance/matrix.json` v1.0.2
- **25 格全部填满**：HK / CN / SG / US / EU × 5 个议题
- **最新更新（2026-05-04）**：US × rwa_issuance — 补充 CLARITY Act（H.R. 3633，2025-07-17 众议院通过），更新 FIT21 条目状态，references 从 5 条增至 6 条

### Module 5 — Retail Education Layer（规划中，最低优先级）

- 尚未实现
- 规划方向：嵌入 Module 3 资产页底部的"散户须知"折叠区，而非独立模块

### Module 6 — Incident Database ✅（v1）

- 路由：`/incidents`、`/incidents/:slug`、`/incidents/methodology`
- 数据：`web/public/data/incidents/incidents.json`，17 条事故（2022–2025）
- 覆盖：9 条全球参考案例 + 8 条香港相关事故

### Module 7 — Quarterly Reports ✅（v1，待发布）

- 路由：`/reports`、`/reports/:slug`、`/reports/methodology`
- 数据：`web/public/data/reports/reports.json`，1 份报告
- **当前状态**：Q1 2026 报告仍为 `status: "preview", isPreview: true`
- **待做**：编辑完成后改为 `published`；创建 Q2 2026 报告

---

## 下一步工作优先级

按规划文档的推荐顺序：

| 优先级 | 任务 |
|---|---|
| 🔴 1 | Module 1 issuer profile 扩充（Reserve/Redemption/Governance 三层 + evidence link），HSBC 和 Anchorpoint 优先 |
| 🔴 2 | Q1 2026 报告从 preview → published |
| 🟡 3 | Module 6 事故数据库扩充（补充更多香港相关事故的结构化字段） |
| 🟡 4 | Module 3 资产 RARM 信号填充（BUIDL、OUSG、Tether Gold 等有公开证据的资产） |
| 🟡 5 | Q2 2026 季报创建 |
| 🟢 6 | Module 2 Ensemble 数据更新（等 HKMA 新披露） |
| 🟢 7 | Module 5 Retail Education Layer（其他模块跑起来再说） |

---

## 合规红线（勿踩）

- 不得生成平台评分或字母评级（SFC Type 10 红线）
- SARM 仅用红黄绿信号，不加权合成数字
- AI 只生成尽调清单，不输出分数
- 管理员视图不得暴露用户评分内容
- 所有内容须有 evidence link，可核查的公开来源

---

## 工具链

| 工具 | 角色 |
|---|---|
| Claude Code | 主要开发工具（代码、配置、数据） |
| OpenClaw（DeepSeek） | 早期版本部分工作（已清理遗留文件） |
| Stitch | 早期 UI 设计（gap-analysis.md 已删） |

---

## 部署命令速查

```bash
# 前端构建 + 部署
cd web && npm run build
rsync -avz --delete dist/ ubuntu@54.255.213.46:/var/www/rwascope/ -e "ssh -i ~/.ssh/lightsail.pem"

# 后端部署
rsync -avz backend/ ubuntu@54.255.213.46:/opt/rwascope-backend/ -e "ssh -i ~/.ssh/lightsail.pem" \
  --exclude='.venv' --exclude='__pycache__' --exclude='*.pyc' --exclude='.env'
ssh -i ~/.ssh/lightsail.pem ubuntu@54.255.213.46 \
  "cd /opt/rwascope-backend && source venv/bin/activate && alembic upgrade head && sudo systemctl restart rwascope-backend"

# 检查后端日志
ssh -i ~/.ssh/lightsail.pem ubuntu@54.255.213.46 "journalctl -u rwascope-backend -f --no-pager"
```
