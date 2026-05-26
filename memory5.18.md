# RWAscope 项目记忆文档 (Memory.md)

> 最后更新: 2026-05-18
> 用途: 新对话继承项目上下文

---

## 1. 项目基本信息

### 项目定位
RWAscope = 机构级 RWA 情报终端，专注于 Real World Asset tokenization 的风险评估与监管情报

### 核心差异化功能
1. **RARM 框架** (RWA tokenization 六层风险评估)
2. **叙事时间轴** (按演进逻辑串联事件，非简单时间排序)
3. **四层因果链可视化** (政策→赛道→机构→资本流向)

### 技术栈
- **后端**: FastAPI + PostgreSQL + Alembic
- **前端**: React + TypeScript + Vite
- **部署**: AWS Lightsail (Ubuntu 24.04)
- **域名**: https://rwa-index.com

---

## 2. 文件路径总结 (关键！)

### 服务器路径 (54.255.213.46)

```bash