# ExquisiteCore Blog

EC 的个人博客，采用 Rust 网关 + Next.js 前端架构。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 16 + React 19 + TypeScript + TailwindCSS v4 + DaisyUI v5 |
| 后端 | Rust + Axum + SeaORM |
| 数据库 | PostgreSQL |

## 架构

```
浏览器 → Rust Gateway (:8080)
              ├── /api/*  → Axum API (Rust)
              └── /*      → 反向代理 → Next.js (:3000)
```

Rust 后端作为统一入口，同时承担 API 服务和反向代理职责，用户只需访问一个端口。

## 功能

- 文章管理（Markdown 编辑器，多语言内容支持）
- 标签系统
- 点赞 / 评论（支持匿名身份追踪）
- JWT 认证（access token + refresh token）
- SEO（SSR、sitemap、JSON-LD 结构化数据）
- 管理后台（文章 / 标签 / 用户管理）

## 本地开发

### 前置条件

- Rust (edition 2024)
- Node.js 20+
- PostgreSQL 16+

### 启动

```bash
# 1. 启动后端（自动执行数据库迁移）
cd backend
cp config.example.toml config.toml  # 编辑数据库连接等配置
cargo run

# 2. 启动前端
cd frontend
npm install
npm run dev

# 3. 访问 http://localhost:8080（通过 Rust 网关）
```

## 项目结构

```
backend/
  src/
    api/          # API 路由处理 (postapi, labelapi, userapi)
    entity/       # SeaORM 实体定义
    migration/    # 数据库迁移
    middleware/   # 身份认证中间件
    routes.rs     # 路由注册 + 反向代理
    wrapper.rs    # ApiResponse 统一响应封装
    state.rs      # 应用状态
frontend/
  app/
    (site)/       # 公开页面 (首页, 博客, 关于, 工具)
    (dashboard)/  # 管理后台
  components/     # React 组件
  lib/            # 工具函数 (axios, auth)
  types/          # TypeScript 类型定义
```

## 感谢

- [DaisyUI](https://daisyui.com/)
- [付小晨](https://fuxiaochen.com/)

## LICENCE

MIT
