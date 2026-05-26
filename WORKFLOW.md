# WORKFLOW.md — RWAscope 开发与部署工作流

> 本文件供 Claude Code 读取。定义从"开始任务"到"上线生产"的完整流程。
> 配合 CLAUDE.md 使用：CLAUDE.md 讲"项目是什么"，本文件讲"怎么改它"。
> 任何修改代码、新增功能、部署上线前必须完整读取本文件。

---

## 0. 工作流总览

```
任务开始
  ↓
[1] 任务分类与分支创建
  ↓
[2] 本地开发（边写边测）
  ↓
[3] 提交前自检（合规 + 测试 + 类型）
  ↓
[4] Git 提交（规范化 commit message）
  ↓
[5] 推送 + Pull Request
  ↓
[6] CI 自动检查（GitHub Actions）
  ↓
[7] 部署到生产（deploy.sh）
  ↓
[8] 上线后验证（健康检查 + 冒烟测试）
```

---

## 1. 任务分类与分支策略

### 1.1 任务类型识别

每个任务必须先归类，决定分支命名和测试范围：

| 类型 | 前缀 | 例子 | 必跑测试 |
|------|------|------|----------|
| **新功能** | `feat/` | `feat/projects-detail-page` | 全量 E2E + 类型检查 |
| **修复 Bug** | `fix/` | `fix/jwt-refresh-loop` | 受影响模块 E2E |
| **重构** | `refactor/` | `refactor/api-client-types` | 全量 E2E + 类型检查 |
| **文档** | `docs/` | `docs/update-rarm-framework` | 无需测试 |
| **样式调整** | `style/` | `style/dashboard-spacing` | 视觉回归测试 |
| **性能优化** | `perf/` | `perf/leaderboard-pagination` | 性能基准测试 |
| **测试补充** | `test/` | `test/add-projects-e2e` | 新增测试本身 |
| **CI/CD** | `ci/` | `ci/add-playwright-action` | CI 自检 |
| **依赖更新** | `chore/` | `chore/upgrade-fastapi` | 全量 E2E |

### 1.2 分支规则

```bash
# 主分支
main          ← 生产分支，受保护，只能通过 PR 合并
develop       ← 开发集成分支（如使用）

# 功能分支命名
<type>/<scope>-<description>

# 例子
feat/intelligence-policy-timeline
fix/auth-token-refresh-401
refactor/move-scripts-to-backend
docs/update-deployment-guide
```

### 1.3 创建分支命令

```bash
# 确保从最新的 main 出发
git checkout main
git pull origin main

# 创建新分支
git checkout -b feat/projects-detail-page

# 立即推送，建立远程追踪
git push -u origin feat/projects-detail-page
```

---

## 2. 本地开发流程

### 2.1 环境准备（首次拉代码后）

```bash
# 1. 后端环境
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# 编辑 .env，填入 DATABASE_URL、SECRET_KEY、DEEPSEEK_API_KEY

# 2. 数据库迁移
alembic upgrade head

# 3. 前端依赖
cd ../web
npm install

# 4. Playwright 浏览器
npx playwright install chromium

# 5. 移动端（可选）
cd ../native
npm install
```

### 2.2 启动开发服务器

```bash
# 终端 1：后端
cd backend && source venv/bin/activate
uvicorn app.main:app --reload --port 8001

# 终端 2：前端
cd web && npm run dev
# → 访问 http://localhost:5173

# 终端 3（按需）：数据脚本测试
cd backend && python3 scripts/fetch_leaderboard.py
```

### 2.3 开发时的实时检查

```bash
# 前端类型检查（边写边看）
cd web && npm run type-check -- --watch

# 后端类型检查（mypy）
cd backend && mypy app/ --watch

# 前端 lint
cd web && npm run lint
```

---

## 3. 模块化任务工作流

### 3.1 新增 API 端点的标准流程

```
顺序：Model → Schema → Router → Test → Frontend Client

Step 1: 定义 SQLAlchemy Model
  backend/app/models/<entity>.py
  → 新字段必须配套 Alembic 迁移

Step 2: 定义 Pydantic Schema
  backend/app/schemas/<entity>.py
  → Request 和 Response 分开定义

Step 3: 实现 Router
  backend/app/routers/<entity>.py
  → 注册到 main.py
  → 公开/私密/管理员权限明确

Step 4: 写后端测试
  backend/tests/test_<entity>.py
  → 至少覆盖 happy path + 鉴权失败 + 边界情况

Step 5: 扩展前端 API Client
  web/src/api/client.ts
  → 新增 entityApi.method()
  → 配套 TypeScript 类型定义

Step 6: 前端使用
  在对应 screen 组件中调用
```

### 3.2 新增前端页面的标准流程

```
Step 1: 定义路由
  web/src/main.tsx 或 web/src/App.tsx
  → 添加 <Route /> 配置

Step 2: 创建 screen 组件
  web/src/screens/<ModuleName>/<PageName>.tsx
  → 使用现有 Layout 包裹
  → 评分相关页面必须包含 <DisclaimerBanner />

Step 3: 添加导航入口
  web/src/components/SideNav.tsx
  → 加入对应菜单项

Step 4: 编写 E2E 测试
  web/e2e/<module>.spec.ts
  → 至少覆盖：页面加载、关键元素显示、用户交互

Step 5: 移动端同步（如适用）
  native/app/<page>.tsx
```

### 3.3 数据库迁移流程

```bash
# 修改 model 后
cd backend

# 1. 自动生成迁移
alembic revision --autogenerate -m "<描述变更>"

# 2. 检查生成的迁移文件
# backend/alembic/versions/<hash>_<msg>.py
# 确认 upgrade() 和 downgrade() 都正确

# 3. 本地执行
alembic upgrade head

# 4. 测试通过后才能提交迁移文件
```

⚠️ **不要修改已合并到 main 的迁移文件**，永远新增迁移。

---

## 4. 提交前自检清单

### 4.1 必跑命令（按顺序）

```bash
# 1. 前端类型检查
cd web && npm run type-check
# 期望：0 errors

# 2. 前端 lint
cd web && npm run lint
# 期望：0 errors

# 3. 前端构建（确保能 build）
cd web && npm run build
# 期望：成功生成 dist/

# 4. 后端类型检查
cd backend && mypy app/
# 期望：0 errors

# 5. 后端测试（如有）
cd backend && pytest
# 期望：全部通过

# 6. E2E 测试（受影响模块）
cd web && npx playwright test <module>
# 例：npx playwright test projects

# 7. 全量 E2E（合并前最后跑一次）
cd web && npx playwright test
```

### 4.2 一键自检脚本

```bash
# 推荐在项目根目录创建 scripts/precheck.sh

#!/bin/bash
set -e

echo "→ Frontend type-check..."
cd web && npm run type-check

echo "→ Frontend lint..."
npm run lint

echo "→ Frontend build..."
npm run build

echo "→ Backend type-check..."
cd ../backend && mypy app/

echo "→ Backend tests..."
pytest

echo "→ E2E tests..."
cd ../web && npx playwright test

echo "✅ All checks passed!"
```

使用：
```bash
chmod +x scripts/precheck.sh
./scripts/precheck.sh
```

### 4.3 合规自检清单（人工逐项确认）

**任何涉及评分、AI输出、报告的代码提交前必须确认：**

- [ ] 新增评分相关页面是否引入 `<DisclaimerBanner />`？
- [ ] AI 输出措辞是否避免了"建议"、"推荐"、"应该"？
- [ ] 报告署名是否为"由[用户姓名]编制"？
- [ ] Projects 详情中 RARM 参考分是否有"研究参考，非平台评级"声明？
- [ ] Intelligence 内容是否只引用可公开核实的官方来源？
- [ ] Intelligence 爬取结果是否走人工审核流程（不直接发布）？
- [ ] 新增 API 端点是否做了所有权验证（防止跨用户访问）？
- [ ] 管理员写入端点是否依赖 `get_admin_user`？
- [ ] 数据库新增字段是否同步写了 Alembic 迁移？
- [ ] 新功能是否有对应 E2E 测试？

---

## 5. Git 提交规范

### 5.1 Commit Message 格式

采用 Conventional Commits：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 5.2 Type 类型

| Type | 用途 |
|------|------|
| `feat` | 新功能 |
| `fix` | 修复 bug |
| `refactor` | 重构（不改功能） |
| `docs` | 仅文档变更 |
| `style` | 样式调整（不影响逻辑） |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `ci` | CI/CD 配置 |
| `chore` | 依赖、构建工具等 |

### 5.3 Scope（项目模块）

```
auth           认证模块
assessment     RARM 评估工作台
intelligence   全球情报模块
projects       项目解剖库
ecosystem      生态图谱
market         市场数据
framework      RARM 框架展示
mobile         移动端
backend        后端通用
frontend       前端通用
deploy         部署相关
```

### 5.4 提交示例

```bash
# 好的提交
git commit -m "feat(projects): add entity map component to project detail page"

git commit -m "fix(auth): resolve JWT refresh loop on expired session

When access_token expires and refresh fails, the client was stuck in
a retry loop. Added max retry count and proper logout fallback.

Fixes #42"

git commit -m "refactor(backend): move scripts/ from api/ to backend/

All data fetching scripts now live under backend/scripts/ for
consistency. Cron jobs and documentation updated."

# 不好的提交（避免）
git commit -m "update"            # ❌ 没信息
git commit -m "fix bug"           # ❌ 太笼统
git commit -m "WIP"               # ❌ 不要提交 WIP 到主流程
```

### 5.5 提交频率

- **小而频繁**：一个逻辑改动 = 一个 commit
- **不要凑数**：不要把无关变更塞进一个 commit
- **可独立回滚**：每个 commit 都应能独立 revert

---

## 6. Pull Request 流程

### 6.1 PR 创建前

```bash
# 1. 同步主分支最新代码
git checkout main
git pull origin main

# 2. rebase 到最新 main（保持线性历史）
git checkout feat/your-branch
git rebase main

# 3. 解决冲突（如有）
# ...

# 4. 强制推送（rebase 后必须）
git push --force-with-lease
```

### 6.2 PR 标题规范

与 commit message 一致：

```
feat(projects): add project detail page with entity map
fix(auth): resolve JWT refresh loop
```

### 6.3 PR 描述模板

```markdown
## 变更内容
简述这个 PR 做了什么。

## 变更类型
- [ ] 新功能（feat）
- [ ] Bug 修复（fix）
- [ ] 重构（refactor）
- [ ] 文档（docs）
- [ ] 其他：____

## 影响模块
- [ ] 认证 / Assessment
- [ ] Intelligence
- [ ] Projects
- [ ] Market
- [ ] Ecosystem
- [ ] 后端 / 数据库
- [ ] 部署 / CI

## 测试
- [ ] 类型检查通过
- [ ] Lint 通过
- [ ] E2E 测试通过
- [ ] 手动测试场景：____

## 合规检查
- [ ] 评分页面有 DisclaimerBanner
- [ ] AI 输出无投资建议措辞
- [ ] 新增 API 端点有权限验证
- [ ] Alembic 迁移已同步

## 截图（前端变更必填）
<贴图>

## 关联 Issue
Closes #XX
```

### 6.4 PR 合并要求

- ✅ 所有 CI 检查通过
- ✅ 至少 1 个 review approve（如有团队）
- ✅ 无未解决的 review comments
- ✅ 与 main 无冲突
- ✅ commit history 干净（必要时 squash）

合并方式：**Squash and Merge**（保持 main 历史线性整洁）

---

## 7. GitHub Actions CI 配置

### 7.1 推荐的 CI 文件结构

```
.github/workflows/
├── ci.yml              ← 每次 push / PR 自动跑
├── deploy.yml          ← main 分支合并后部署到生产
└── nightly.yml         ← 每晚跑全量测试 + 数据更新验证
```

### 7.2 ci.yml 关键步骤

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: web/package-lock.json
      - run: cd web && npm ci
      - run: cd web && npm run type-check
      - run: cd web && npm run lint
      - run: cd web && npm run build

  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: rwascope_test
        ports: ['5432:5432']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: cd backend && pip install -r requirements.txt
      - run: cd backend && mypy app/
      - run: cd backend && alembic upgrade head
        env:
          DATABASE_URL: postgresql+asyncpg://postgres:test@localhost/rwascope_test
      - run: cd backend && pytest
        env:
          DATABASE_URL: postgresql+asyncpg://postgres:test@localhost/rwascope_test

  e2e:
    needs: [frontend, backend]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd web && npm ci
      - run: cd web && npx playwright install --with-deps chromium
      - run: cd web && npm run build
      - run: cd web && npx playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: web/playwright-report/
```

### 7.3 deploy.yml 关键步骤

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: SSH Deploy
        uses: appleboy/ssh-action@v1
        with:
          host: 54.255.213.46
          username: ubuntu
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd ~/rwascope
            git pull origin main
            ./scripts/deploy.sh
```

---

## 8. 部署到生产流程

### 8.1 部署前检查

```bash
# 1. 确认 CI 已通过
# 2. 确认 main 分支无新提交
# 3. 备份生产数据库
ssh ubuntu@54.255.213.46
pg_dump rwascope_backend > ~/backups/db_$(date +%Y%m%d_%H%M).sql
```

### 8.2 部署脚本（scripts/deploy.sh）

```bash
#!/bin/bash
set -e

echo "→ Pulling latest code..."
git pull origin main

echo "→ Frontend build..."
cd web
npm ci
npm run build

echo "→ Deploying frontend (preserving leaderboard.json)..."
# 关键：不能覆盖生产的 public/data/leaderboard.json
rsync -avz --delete \
  --exclude='data/' \
  dist/ /var/www/rwascope/

echo "→ Backend dependencies..."
cd ../backend
source venv/bin/activate
pip install -r requirements.txt

echo "→ Database migrations..."
alembic upgrade head

echo "→ Restarting backend service..."
sudo systemctl restart rwascope-backend

echo "→ Waiting for service to be healthy..."
sleep 3
curl -f https://rwa-index.com/api/health || {
  echo "❌ Health check failed!"
  exit 1
}

echo "✅ Deploy complete!"
```

### 8.3 部署后验证（冒烟测试）

```bash
# 1. 健康检查
curl https://rwa-index.com/api/health
# 期望：{"status": "ok"}

# 2. 关键页面加载
curl -I https://rwa-index.com/
curl -I https://rwa-index.com/intelligence
curl -I https://rwa-index.com/projects
# 期望：200 OK

# 3. API 关键端点
curl https://rwa-index.com/api/assessments/layers
# 期望：返回 RARM 六层定义 JSON

# 4. 数据完整性
curl https://rwa-index.com/data/leaderboard.json | jq '.[] | length'
# 期望：> 0
```

### 8.4 回滚流程

```bash
# 如果部署后发现严重问题：

ssh ubuntu@54.255.213.46
cd ~/rwascope

# 1. 回滚代码
git log --oneline -5    # 找到上一个稳定 commit
git reset --hard <commit-hash>

# 2. 回滚数据库（如必要）
alembic downgrade -1

# 3. 恢复前端
cd web && npm run build
rsync -avz --delete --exclude='data/' dist/ /var/www/rwascope/

# 4. 重启后端
sudo systemctl restart rwascope-backend

# 5. 验证
curl https://rwa-index.com/api/health
```

---

## 9. Hotfix 流程（紧急修复）

```bash
# 1. 从 main 直接创建 hotfix 分支
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-description

# 2. 最小化修改（只修这个 bug）
# ...

# 3. 快速测试
cd web && npx playwright test <affected-module>
cd backend && pytest tests/test_<affected>.py

# 4. 提交
git commit -m "fix(scope): critical bug description"
git push -u origin hotfix/critical-bug-description

# 5. 创建 PR，标记为 URGENT
# 6. 跳过非必需检查，直接合并到 main
# 7. 立即部署
ssh ubuntu@54.255.213.46
cd ~/rwascope && ./scripts/deploy.sh
```

---

## 10. 定时任务（Cron）管理

### 10.1 当前 Cron 列表

```bash
# 查看
crontab -l

# 编辑
crontab -e

# 当前任务：
0 2 * * * python3 /home/ubuntu/rwascope/backend/scripts/fetch_leaderboard.py >> /var/log/rwascope-cron.log 2>&1
0 6 * * * python3 /home/ubuntu/rwascope/backend/scripts/fetch_intelligence.py >> /var/log/rwascope-cron.log 2>&1
0 8 * * 1 python3 /home/ubuntu/rwascope/backend/scripts/generate_weekly_report.py >> /var/log/rwascope-cron.log 2>&1
```

### 10.2 新增 Cron 任务规范

- 脚本必须放在 `backend/scripts/`
- 必须有日志输出（`>> /var/log/rwascope-cron.log 2>&1`）
- 必须有失败重试或告警机制
- 脚本第一行注明用途和调度时间

```python
#!/usr/bin/env python3
"""
fetch_intelligence.py

抓取全球 RWA 相关监管政策，AI 解读后存入数据库。
调度：每天 06:00 UTC（Cron: 0 6 * * *）
日志：/var/log/rwascope-cron.log

注意：AI 解读结果需人工审核后才上线（rwa_relevant 字段默认 false）。
"""
```

### 10.3 Cron 任务监控

```bash
# 查看最近日志
tail -100 /var/log/rwascope-cron.log

# 查看某个脚本的最后执行
grep "fetch_intelligence" /var/log/rwascope-cron.log | tail -10

# 手动触发测试
python3 /home/ubuntu/rwascope/backend/scripts/fetch_intelligence.py
```

---

## 11. 环境变量管理

### 11.1 环境分层

```
本地开发：  backend/.env （不提交，加入 .gitignore）
CI 测试：   GitHub Actions secrets
生产环境：  服务器上的 backend/.env （ssh 编辑）
```

### 11.2 新增环境变量流程

```
1. backend/.env.example 添加变量（无敏感值）
2. backend/app/config.py 添加 Settings 字段
3. 本地 backend/.env 填入值
4. 通知团队更新生产 .env
5. GitHub Actions 如需该变量，添加到 secrets

✅ .env.example 必须随代码提交
❌ .env 永远不能提交
```

### 11.3 Secret 轮换

定期轮换以下密钥：
- `SECRET_KEY`（JWT 签名）：每 6 个月
- `DEEPSEEK_API_KEY`：泄露时立即
- 数据库密码：每 12 个月

轮换 JWT SECRET_KEY 会导致所有用户被强制重新登录。

---

## 12. 文档同步规范

代码变更时，**必须同步更新**对应文档：

| 代码变更 | 必须更新的文档 |
|---------|--------------|
| 新增 API 端点 | `CLAUDE.md` Section 6 |
| 新增数据库表/字段 | `CLAUDE.md` Section 5 + Alembic 迁移 |
| 新增页面/路由 | `CLAUDE.md` Section 3 |
| 修改部署流程 | `WORKFLOW.md` Section 8 + `scripts/deploy.sh` |
| 新增 Cron 任务 | `WORKFLOW.md` Section 10 + crontab |
| 新增环境变量 | `backend/.env.example` + `CLAUDE.md` Section 4 |
| 改变 RARM 框架 | `CLAUDE.md` Section 7（重要，影响业务逻辑） |
| 合规相关变更 | `CLAUDE.md` Section 1.3 + 检查清单 |

---

## 13. 紧急联系与升级

### 13.1 严重故障定义

- 生产 API 500 错误率 > 5%
- 数据库连接失败
- 数据丢失或损坏
- 安全漏洞（用户数据泄露）
- DeepSeek API 完全不可用 > 30 分钟

### 13.2 故障响应顺序

```
1. 立刻：检查 systemctl status rwascope-backend
2. 立刻：查看日志 sudo journalctl -u rwascope-backend -n 100
3. 5 分钟内：决定是否回滚（参考 8.4）
4. 15 分钟内：若不能修复，触发 maintenance page
5. 1 小时内：根因分析与修复方案
6. 24 小时内：写 post-mortem 文档
```

### 13.3 Maintenance Page

```bash
# 临时显示维护页（Nginx）
sudo cp /var/www/maintenance.html /var/www/rwascope/index.html

# 恢复
cd ~/rwascope && ./scripts/deploy.sh
```

---

## 14. 常见 Workflow 问题

```
Q: rebase 后 force push 安全吗？
A: 用 --force-with-lease 而不是 --force，避免覆盖他人提交。

Q: Alembic 自动生成迁移漏掉了字段？
A: 检查 model 是否 import 到 alembic/env.py。

Q: E2E 测试在 CI 失败但本地通过？
A: 通常是时序问题（CI 较慢），加 await page.waitFor... 而不是 sleep。

Q: 部署后某个功能不工作但本地正常？
A: 检查 .env 配置是否同步、Alembic 迁移是否已执行、Nginx 缓存是否清除。

Q: leaderboard.json 在部署后丢失？
A: 检查 deploy.sh 是否用了 --exclude='data/'。手动恢复：
   python3 backend/scripts/fetch_leaderboard.py

Q: 长时间 PR 与 main 冲突严重？
A: 频繁 rebase main，不要让分支生命周期超过 1 周。

Q: 提交后想修改 commit message？
A: 未推送：git commit --amend
   已推送：git commit --amend && git push --force-with-lease
```

---

## 15. 工作流核心原则（必记）

1. **永远从最新 main 出发**：开始任务前先 `git pull`
2. **小步快跑**：每天至少 1 个 commit，每个 PR 不超过 500 行变更
3. **测试先行**：写功能前先想"怎么测"
4. **合规优先**：评分相关功能必须过合规检查清单
5. **不破坏 main**：CI 没过的代码绝不合并
6. **生产可回滚**：每个部署都要能在 5 分钟内回滚
7. **数据库单向**：不修改已合并的 Alembic 迁移
8. **文档与代码同步**：改代码必改文档
9. **环境变量永不进代码**：用 .env + .env.example
10. **学术严谨性 > 功能炫酷**：RARM 框架是平台根基，任何变更需有学术依据

---

*WORKFLOW.md 版本：v1.0
最后更新：2026-05-12
配套文档：CLAUDE.md v2.0*
