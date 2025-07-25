# Docker 部署指南

本文档提供了使用 Docker 部署博客系统的详细说明，包括开发和生产环境配置。

## 快速开始

### 1. 克隆仓库并初始化环境

```bash
git clone <仓库地址>
cd Blog

# 创建环境配置文件
cp .env.example .env
# 编辑 .env 文件，修改数据库密码等敏感信息
```

### 2. 启动开发环境

```bash
# 使用部署脚本（推荐）
./deploy.sh start dev

# 或直接使用 docker-compose
docker-compose up -d
```

### 3. 访问服务

- **前端网站**: http://localhost:4321
- **后端 API**: http://localhost:8080/api
- **数据库管理**: http://localhost:8081 (需启用 tools profile)

## 环境配置

### Docker Compose 文件说明

- `docker-compose.yml` - 基础配置，适用于开发环境
- `docker-compose.override.yml` - 开发环境覆盖配置（自动加载）
- `docker-compose.prod.yml` - 生产环境配置
- `docker-compose.1panel.yml` - 1Panel 集成配置

### 环境变量配置

复制 `.env.example` 到 `.env` 并根据需要修改：

```bash
# === 数据库配置 ===
POSTGRES_PASSWORD=your_secure_password
POSTGRES_USER=postgres
POSTGRES_DB=Blog
DATABASE_URL=postgres://postgres:your_secure_password@postgres:5432/Blog

# === JWT 配置 ===
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters

# === API 配置 ===
PUBLIC_API_BASE_URL=http://localhost:8080/api
INTERNAL_API_BASE_URL=http://backend:8080/api

# === 其他配置 ===
HOST=0.0.0.0
PORT=4321
NODE_ENV=production
```

## 部署脚本使用

项目提供了便捷的部署脚本：

### 通用部署脚本 (`./deploy.sh`)

```bash
# 设置环境
./deploy.sh setup [dev|prod]

# 构建镜像
./deploy.sh build [dev|prod]

# 启动服务
./deploy.sh start [dev|prod]

# 停止服务
./deploy.sh stop [dev|prod]

# 查看状态
./deploy.sh status [dev|prod]

# 查看日志
./deploy.sh logs [dev|prod]

# 健康检查
./deploy.sh health [dev|prod]

# 备份数据库
./deploy.sh backup [dev|prod]
```

### 1Panel 专用脚本 (`./deploy-1panel.sh`)

适用于使用 1Panel 面板的服务器：

```bash
# 初始化环境
./deploy-1panel.sh setup

# 启动服务
./deploy-1panel.sh start

# 显示 1Panel 配置说明
./deploy-1panel.sh config yourdomain.com

# 其他操作
./deploy-1panel.sh status
./deploy-1panel.sh logs
./deploy-1panel.sh backup
```

## 开发环境

开发环境使用 `docker-compose.override.yml` 提供以下特性：

- 源代码热重载
- 调试端口暴露
- 开发数据库
- 详细日志输出
- 开发工具（Adminer）

### 启动开发环境

```bash
# 方法 1：使用部署脚本
./deploy.sh start dev

# 方法 2：直接使用 docker-compose
docker-compose up -d

# 方法 3：包含开发工具
docker-compose --profile tools up -d
```

### 开发工具访问

启用 `tools` profile 后可访问：
- **Adminer**: http://localhost:8081 (数据库管理)

## 生产环境

### 准备生产环境

1. **创建生产配置**

```bash
cp .env.example .env
# 编辑 .env 文件，设置生产环境的配置
```

2. **生成安全密钥**（如使用完整生产配置）

```bash
mkdir -p secrets
openssl rand -base64 32 > secrets/postgres_password.txt
openssl rand -base64 64 > secrets/jwt_secret.txt
chmod 600 secrets/*
```

3. **启动生产环境**

```bash
# 使用部署脚本
./deploy.sh start prod

# 或直接使用 docker-compose
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 生产环境特性

- Nginx 反向代理
- SSL/TLS 支持
- Redis 缓存
- 资源限制和优化
- 健康检查
- 日志轮转
- 安全加固

## 1Panel 集成部署

对于使用 1Panel 面板的服务器，使用专门的配置文件：

### 特性

- 服务仅绑定本地接口（127.0.0.1）
- 通过 1Panel OpenResty 代理访问
- 简化的配置管理
- 自动 SSL 证书管理

### 部署步骤

1. **初始化环境**

```bash
./deploy-1panel.sh setup
```

2. **启动服务**

```bash
./deploy-1panel.sh start
```

3. **配置 1Panel**

```bash
./deploy-1panel.sh config yourdomain.com
```

按照输出的说明在 1Panel 面板中配置反向代理。

## 监控和维护

### 健康检查

```bash
# 检查所有服务状态
./deploy.sh health [env]

# 查看详细状态
./deploy.sh status [env]
```

### 日志管理

```bash
# 查看所有服务日志
./deploy.sh logs [env]

# 查看特定服务日志
docker-compose logs [service_name]

# 实时查看日志
docker-compose logs -f [service_name]
```

### 数据备份

```bash
# 自动备份
./deploy.sh backup [env]

# 手动备份
docker-compose exec postgres pg_dump -U postgres Blog > backup.sql
```

### 数据恢复

```bash
# 使用脚本恢复
./deploy.sh restore [env] backup_file.sql

# 手动恢复
docker-compose exec -T postgres psql -U postgres -d Blog < backup.sql
```

## 故障排除

### 常见问题

1. **端口冲突**
   - 修改 `.env` 文件中的端口配置
   - 或修改 `docker-compose.yml` 中的端口映射

2. **数据库连接失败**
   ```bash
   # 检查数据库状态
   docker-compose exec postgres pg_isready -U postgres
   
   # 重启数据库
   docker-compose restart postgres
   ```

3. **构建失败**
   ```bash
   # 清理构建缓存
   docker builder prune -a
   
   # 重新构建
   ./deploy.sh build [env]
   ```

### 性能优化

- 调整 `docker-compose.yml` 中的资源限制
- 优化数据库配置
- 使用 Redis 缓存（生产环境）
- 配置 Nginx 压缩和缓存

## 安全最佳实践

1. **密钥管理**
   - 使用强密码
   - 定期更换 JWT 密钥
   - 不要在代码中硬编码密钥

2. **网络安全**
   - 生产环境不要暴露数据库端口
   - 使用 HTTPS
   - 配置防火墙规则

3. **定期更新**
   - 更新 Docker 镜像
   - 更新应用依赖
   - 监控安全漏洞

---

更多详细信息请参考：
- [项目 README](./README.md)
- [1Panel 集成指南](./1PANEL-INTEGRATION.md)
- [更新日志](./CHANGELOG.md)