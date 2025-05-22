# Docker 部署指南

本文档提供了使用 Docker 部署博客系统的详细说明。

## 前提条件

- 安装 [Docker](https://docs.docker.com/get-docker/)
- 安装 [Docker Compose](https://docs.docker.com/compose/install/)

## 快速开始

### 1. 克隆仓库

```bash
git clone <仓库地址>
cd Blog
```

### 2. 启动服务

使用以下命令启动所有服务（PostgreSQL 数据库、后端 API 和前端网站）：

```bash
docker-compose up -d
```

这将在后台启动所有容器。首次运行时，Docker 会构建镜像，这可能需要一些时间。

### 3. 访问服务

- 前端网站: http://localhost:4321
- 后端 API: http://localhost:8080
- PostgreSQL 数据库: localhost:5432 (用户名: postgres, 密码: 123456, 数据库: Blog)

## 常用命令

### 查看日志

```bash
# 查看所有服务的日志
docker-compose logs

# 查看特定服务的日志
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# 实时查看日志
docker-compose logs -f
```

### 停止服务

```bash
docker-compose down
```

### 重新构建并启动

如果代码有更新，需要重新构建镜像：

```bash
docker-compose build
docker-compose up -d
```

或者一步完成：

```bash
docker-compose up -d --build
```

## 数据持久化

PostgreSQL 数据存储在名为 `postgres_data` 的 Docker 卷中，即使容器被删除，数据也会保留。

## 环境配置

- 后端配置文件位于 `backend/config.docker.toml`
- 数据库连接信息在 `docker-compose.yml` 中配置

## 生产环境部署注意事项

1. 修改 `backend/config.docker.toml` 中的 JWT 密钥
2. 修改数据库密码
3. 配置 HTTPS
4. 根据需要调整资源限制

## 故障排除

### 数据库连接问题

确保 PostgreSQL 容器已经完全启动，后端服务才能成功连接。如果遇到连接问题，可以检查日志：

```bash
docker-compose logs postgres
docker-compose logs backend
```

### 端口冲突

如果本地已有服务占用了 4321、8080 或 5432 端口，可以在 `docker-compose.yml` 中修改端口映射。