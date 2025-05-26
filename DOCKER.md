# Docker 部署指南

本文档提供了使用 Docker 部署博客系统的详细说明，包括开发和生产环境配置。

## 目录

- [前提条件](#前提条件)
- [快速开始](#快速开始)
- [环境配置](#环境配置)
- [部署脚本使用](#部署脚本使用)
- [开发环境](#开发环境)
- [生产环境](#生产环境)
- [监控和日志](#监控和日志)
- [备份与恢复](#备份与恢复)
- [故障排除](#故障排除)
- [安全配置](#安全配置)

## 前提条件

### 必需软件

- [Docker](https://docs.docker.com/get-docker/) >= 20.10
- [Docker Compose](https://docs.docker.com/compose/install/) >= 2.0
- Git
- curl (用于健康检查)

### 系统要求

- **开发环境**: 最小 4GB RAM, 2 CPU cores
- **生产环境**: 最小 8GB RAM, 4 CPU cores
- 磁盘空间: 至少 10GB 可用空间

### 验证安装

```bash
docker --version
docker-compose --version
```

## 快速开始

### 1. 克隆仓库

```bash
git clone <仓库地址>
cd Blog
```

### 2. 初始化环境

```bash
# 自动设置开发环境
./deploy.sh setup dev

# 或手动创建环境文件
cp .env.example .env
```

### 3. 启动开发环境

```bash
# 使用部署脚本（推荐）
./deploy.sh start dev

# 或使用 docker-compose
docker-compose up -d
```

### 4. 访问服务

- **前端网站**: http://localhost:4321
- **后端 API**: http://localhost:8080
- **数据库管理**: http://localhost:8081 (Adminer)
- **PostgreSQL**: localhost:5432

## 环境配置

### 环境变量文件

项目支持多个环境配置文件：

- `.env` - 开发环境（自动加载）
- `.env.prod` - 生产环境
- `.env.example` - 环境变量模板

### 主要配置项

```bash
# 数据库配置
POSTGRES_PASSWORD=your_secure_password
POSTGRES_USER=postgres
POSTGRES_DB=Blog
DATABASE_URL=postgres://postgres:password@postgres:5432/Blog

# JWT 安全配置
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters

# API 配置
PUBLIC_API_BASE_URL=http://localhost:8080/api
INTERNAL_API_BASE_URL=http://backend:8080/api

# 前端配置
HOST=0.0.0.0
PORT=4321

# CORS 配置
ALLOWED_ORIGINS=http://localhost:4321,https://yourdomain.com

# 端口映射
POSTGRES_PORT=5432
BACKEND_PORT=8080
FRONTEND_PORT=4321
```

## 部署脚本使用

项目提供了便捷的部署脚本 `deploy.sh`，支持多种操作：

### 基本命令

```bash
# 查看帮助
./deploy.sh help

# 设置环境
./deploy.sh setup [dev|prod]

# 构建镜像
./deploy.sh build [dev|prod]

# 启动服务
./deploy.sh start [dev|prod]

# 停止服务
./deploy.sh stop [dev|prod]

# 重启服务
./deploy.sh restart [dev|prod]

# 查看状态
./deploy.sh status [dev|prod]

# 查看日志
./deploy.sh logs [dev|prod]

# 健康检查
./deploy.sh health [dev|prod]
```

### 数据管理

```bash
# 备份数据库
./deploy.sh backup [dev|prod]

# 恢复数据库
./deploy.sh restore [dev|prod] backup_file.sql

# 更新应用
./deploy.sh update [dev|prod]

# 清理资源
./deploy.sh cleanup
```

## 开发环境

### 特性

- 启用热重载
- 开发工具集成
- 详细错误日志
- 数据库管理界面
- 源代码挂载

### 启动开发环境

```bash
# 方法 1: 使用部署脚本（推荐）
./deploy.sh start dev

# 方法 2: 直接使用 docker-compose
docker-compose up -d

# 方法 3: 包含开发工具
docker-compose --profile tools up -d
```

### 开发工具

启用 `tools` profile 可获得额外的开发工具：

```bash
docker-compose --profile tools up -d
```

包含的工具：
- **Adminer**: 数据库管理界面 (http://localhost:8081)

### 代码修改

开发环境支持热重载：

- **前端**: 修改源代码后自动重新构建
- **后端**: 需要重新构建容器
- **配置**: 修改配置文件后需要重启相应服务

## 生产环境

### 特性

- SSL/TLS 终端
- Nginx 反向代理
- Redis 缓存
- 资源限制
- 健康检查
- 日志轮转
- 安全加固

### 准备生产环境

1. **创建生产配置**

```bash
# 复制并编辑生产环境配置
cp .env.example .env.prod
nano .env.prod
```

2. **生成安全密钥**

```bash
# 创建 secrets 目录
mkdir -p secrets

# 生成数据库密码
openssl rand -base64 32 > secrets/postgres_password.txt

# 生成 JWT 密钥
openssl rand -base64 64 > secrets/jwt_secret.txt

# 设置安全权限
chmod 600 secrets/*
```

3. **配置 SSL 证书**

```bash
# 创建 SSL 目录
mkdir -p ssl

# 复制你的证书文件
cp your-cert.pem ssl/cert.pem
cp your-key.pem ssl/key.pem
```

### 启动生产环境

```bash
# 使用部署脚本
./deploy.sh start prod

# 或使用 docker-compose
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 生产环境架构

```
Internet
    ↓
Nginx (Port 80/443)
    ↓
Frontend (Port 4321)
    ↓
Backend (Port 8080)
    ↓
PostgreSQL (Port 5432)
Redis (Cache)
```

### Nginx 配置

生产环境使用 Nginx 作为反向代理，提供：

- SSL 终端
- 静态文件服务
- 负载均衡
- 速率限制
- 安全头
- Gzip 压缩

配置文件位置：
- `nginx/nginx.conf` - 主配置
- `nginx/conf.d/` - 站点配置

## 监控和日志

### 查看日志

```bash
# 查看所有服务日志
./deploy.sh logs [env]

# 查看特定服务日志
docker-compose logs [service_name]

# 实时查看日志
docker-compose logs -f [service_name]
```

### 健康检查

```bash
# 检查所有服务健康状态
./deploy.sh health [env]

# 查看详细状态
./deploy.sh status [env]
```

### 日志配置

生产环境配置了日志轮转：

- 最大文件大小: 10MB
- 保留文件数: 3
- 格式: JSON

日志位置：
- Nginx: `./logs/nginx/`
- 应用: Docker 容器日志

## 备份与恢复

### 自动备份

```bash
# 备份数据库
./deploy.sh backup [env]

# 备份文件位置
ls ./backup/
```

### 手动备份

```bash
# PostgreSQL 备份
docker-compose exec postgres pg_dump -U postgres Blog > backup.sql

# 压缩备份
gzip backup.sql
```

### 恢复数据

```bash
# 使用部署脚本恢复
./deploy.sh restore [env] backup_file.sql

# 手动恢复
docker-compose exec -T postgres psql -U postgres -d Blog < backup.sql
```

### 备份策略建议

- **开发环境**: 按需备份
- **生产环境**: 每日自动备份
- **保留策略**: 保留 30 天内的备份

## 故障排除

### 常见问题

#### 1. 端口冲突

**症状**: 服务启动失败，提示端口被占用

**解决方案**:
```bash
# 查看占用的端口
netstat -tulpn | grep :8080

# 修改 docker-compose.yml 中的端口映射
ports:
  - "8081:8080"  # 将主机端口改为 8081
```

#### 2. 数据库连接失败

**症状**: 后端无法连接数据库

**解决方案**:
```bash
# 检查数据库状态
docker-compose exec postgres pg_isready -U postgres

# 查看数据库日志
docker-compose logs postgres

# 重启数据库服务
docker-compose restart postgres
```

#### 3. 内存不足

**症状**: 容器频繁重启或 OOM

**解决方案**:
```bash
# 查看资源使用情况
docker stats

# 调整内存限制（在 docker-compose.yml 中）
deploy:
  resources:
    limits:
      memory: 1G
```

#### 4. 构建失败

**症状**: Docker 镜像构建失败

**解决方案**:
```bash
# 清理构建缓存
docker builder prune -a

# 重新构建
./deploy.sh build [env]

# 查看详细构建日志
docker-compose build --no-cache --progress=plain
```

### 日志分析

```bash
# 查看错误日志
docker-compose logs | grep ERROR

# 查看特定时间段的日志
docker-compose logs --since="2024-01-01T00:00:00" --until="2024-01-01T23:59:59"

# 导出日志到文件
docker-compose logs > app.log
```

### 性能调优

#### 数据库优化

```bash
# 调整 PostgreSQL 配置
# 在 docker-compose.yml 中添加
environment:
  - POSTGRES_INITDB_ARGS=--auth-host=scram-sha-256
  - POSTGRES_MAX_CONNECTIONS=100
  - POSTGRES_SHARED_BUFFERS=256MB
```

#### 应用优化

```bash
# 后端优化
environment:
  - RUST_LOG=info  # 减少日志级别
  - DATABASE_MAX_CONNECTIONS=10

# 前端优化
environment:
  - NODE_ENV=production
  - NODE_OPTIONS=--max-old-space-size=1024
```

## 安全配置

### 密钥管理

```bash
# 使用 Docker secrets（生产环境）
echo "strong_password" | docker secret create postgres_password -
echo "super_secret_jwt_key" | docker secret create jwt_secret -
```

### 网络安全

```bash
# 创建隔离网络
docker network create --driver bridge blog-network

# 配置防火墙（Ubuntu/Debian）
ufw allow 80/tcp
ufw allow 443/tcp
ufw deny 5432/tcp  # 禁止外部访问数据库
```

### SSL/TLS 配置

```bash
# 使用 Let's Encrypt 证书
certbot certonly --webroot -w /var/www/html -d yourdomain.com

# 复制证书到项目
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
```

### 定期更新

```bash
# 更新 Docker 镜像
docker-compose pull

# 更新应用代码
./deploy.sh update [env]

#
更新系统
apt update && apt upgrade -y
```

## 环境变量参考

### 完整环境变量列表

```bash
# === 数据库配置 ===
POSTGRES_PASSWORD=secure_password_here
POSTGRES_USER=postgres
POSTGRES_DB=Blog
DATABASE_URL=postgres://postgres:password@postgres:5432/Blog
POSTGRES_PORT=5432

# === JWT 配置 ===
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters

# === API 配置 ===
PUBLIC_API_BASE_URL=http://localhost:8080/api
INTERNAL_API_BASE_URL=http://backend:8080/api
BACKEND_PORT=8080

# === 前端配置 ===
HOST=0.0.0.0
PORT=4321
FRONTEND_PORT=4321
NODE_ENV=production

# === CORS 配置 ===
ALLOWED_ORIGINS=http://localhost:4321,https://yourdomain.com

# === Redis 配置 ===
REDIS_PASSWORD=secure_redis_password

# === 日志配置 ===
RUST_LOG=info
RUST_BACKTRACE=0

# === SSL 配置 ===
SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/key.pem
```

## 最佳实践

### 开发流程

1. 使用 `deploy.sh setup dev` 初始化环境
2. 定期备份数据：`deploy.sh backup dev`
3. 代码变更后重新构建：`deploy.sh build dev`
4. 使用健康检查确认服务状态：`deploy.sh health dev`

### 生产部署

1. 在测试环境验证所有更改
2. 创建生产环境备份
3. 使用蓝绿部署或滚动更新
4. 监控服务状态和性能指标
5. 准备回滚计划

### 安全建议

1. 定期更新密钥和证书
2. 使用强密码和双因素认证
3. 限制网络访问和端口暴露
4. 定期审查和更新依赖项
5. 监控异常访问和错误日志

---

如需更多帮助，请参考：
- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [项目 GitHub Issues](https://github.com/your-repo/issues)