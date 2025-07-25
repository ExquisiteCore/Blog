# 1Panel 集成部署指南

本文档提供了在 1Panel 面板中部署博客系统的详细指南。

## 关于 1Panel

1Panel 是一个现代化、开源的 Linux 服务器运维管理面板，提供：

- 容器管理（Docker & Docker Compose）
- 网站管理（基于 OpenResty）
- SSL 证书自动管理
- 文件管理和数据库管理
- 丰富的应用商店

## 部署方案

本项目提供两种 1Panel 部署方式：

### 方案一：容器编排（推荐）

使用 1Panel 的容器编排功能直接管理 Docker Compose 项目。

**优势：**
- 直接在 1Panel 中管理容器生命周期
- 可视化的日志查看和监控
- 统一的环境变量管理
- 容易维护和更新

### 方案二：网站反向代理

使用 1Panel 的网站管理功能创建反向代理。

**优势：**
- 自动 SSL 证书管理
- 更好的域名管理
- 内置的 Web 服务器优化

## 快速部署

### 步骤 1：准备环境

```bash
# 克隆项目
git clone <仓库地址>
cd Blog

# 初始化环境
./deploy-1panel.sh setup
```

### 步骤 2：构建镜像（可选）

```bash
# 如果需要本地构建
./deploy-1panel.sh build
```

### 步骤 3：查看部署指南

```bash
# 显示详细的部署指南
./deploy-1panel.sh guide yourdomain.com
```

### 步骤 4：在 1Panel 中部署

按照脚本输出的指南在 1Panel 中进行操作。

## 详细部署步骤

### 方案一：容器编排部署

#### 1. 登录 1Panel 管理面板

访问您的服务器 IP：`https://your-server-ip:1Panel端口`

#### 2. 创建容器编排

1. 进入 **容器** -> **编排**
2. 点击 **创建编排**
3. 填写以下信息：
   - **名称**: `blog-system`
   - **描述**: `博客系统`
   - **路径**: 您的项目路径（如 `/opt/Blog`）
4. **Compose 文件**: 选择 `docker-compose.1panel.yml`
5. **环境变量**: 选择 `.env` 文件
6. 点击 **创建**

#### 3. 启动服务

1. 在编排列表中找到 `blog-system`
2. 点击 **启动** 按钮
3. 等待所有服务启动完成

### 方案二：网站反向代理部署

#### 1. 先启动容器

按照上面的方案一先启动容器服务。

#### 2. 创建网站

1. 进入 **网站** -> **网站管理**
2. 点击 **创建网站**
3. 选择 **反向代理** 类型
4. 填写信息：
   - **主域名**: `yourdomain.com`
   - **代理地址**: `http://127.0.0.1:4321`
5. 点击 **创建**

#### 3. 配置 API 代理（可选）

在网站的 **配置** -> **修改配置** 中添加：

```nginx
location /api {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

#### 4. 配置 SSL 证书（推荐）

1. 在网站管理中找到您的网站
2. 点击 **证书** 选项卡
3. 点击 **申请证书**
4. 选择 **Let's Encrypt** 或其他证书提供商
5. 填写必要信息并申请

## 管理和维护

### 监控容器状态

```bash
# 查看容器状态
./deploy-1panel.sh status

# 查看服务日志
./deploy-1panel.sh logs

# 查看特定服务日志
./deploy-1panel.sh logs backend
```

### 在 1Panel 中管理

1. **监控**: 在 **容器** -> **编排** 中查看容器状态
2. **日志**: 点击容器名称查看详细日志
3. **操作**: 可以直接停止/启动/重启容器
4. **网站**: 在 **网站管理** 中管理域名和 SSL

### 数据备份

```bash
# 备份数据库
./deploy-1panel.sh backup

# 恢复数据库
./deploy-1panel.sh restore backup_file.sql.gz
```

### 更新应用

1. 在 1Panel 中停止容器编排
2. 更新代码：`git pull`
3. 重新构建：`./deploy-1panel.sh build`
4. 在 1Panel 中重新启动编排

## 配置说明

### 环境变量

项目使用 `.env` 文件管理配置，主要参数：

```bash
# 数据库配置
POSTGRES_PASSWORD=随机生成的安全密码
POSTGRES_USER=postgres
POSTGRES_DB=Blog

# JWT 安全配置
JWT_SECRET=随机生成的安全密钥

# API 地址配置
PUBLIC_API_BASE_URL=https://yourdomain.com/api

# 端口配置
BACKEND_PORT=8080
FRONTEND_PORT=4321
```

### Docker Compose 配置

`docker-compose.1panel.yml` 文件针对 1Panel 优化：

- 使用标准端口映射（非 127.0.0.1 绑定）
- 合理的资源限制
- 完善的健康检查
- 适合生产环境的配置

## 故障排除

### 常见问题

#### 1. 容器启动失败

1. 检查环境变量配置
2. 查看容器日志：`./deploy-1panel.sh logs`
3. 检查端口占用情况

#### 2. 网站无法访问

1. 检查容器是否正常运行
2. 检查 1Panel 网站配置
3. 检查防火墙和安全组配置

#### 3. SSL 证书问题

1. 检查域名 DNS 解析
2. 检查 80/443 端口是否开放
3. 在 1Panel 中重新申请证书

### 日志查看

```bash
# 查看所有服务日志
./deploy-1panel.sh logs

# 查看特定服务日志
./deploy-1panel.sh logs postgres
./deploy-1panel.sh logs backend
./deploy-1panel.sh logs frontend
```

或者在 1Panel 的容器管理中直接查看。

## 最佳实践

### 安全建议

1. **定期备份**: 设置定时任务备份数据库
2. **更新密码**: 定期更换数据库和 JWT 密码
3. **监控日志**: 在 1Panel 中设置日志监控告警
4. **SSL 证书**: 使用 1Panel 的自动续期功能

### 性能优化

1. **资源限制**: 根据服务器配置调整 Docker Compose 中的资源限制
2. **日志管理**: 在 1Panel 中配置日志轮转
3. **缓存配置**: 在 OpenResty 中配置静态文件缓存

### 维护流程

1. **监控**: 使用 1Panel 的仪表盘监控系统状态
2. **备份**: 每日自动备份数据库
3. **更新**: 在低峰期进行代码更新
4. **清理**: 定期清理未使用的 Docker 资源

---

更多信息请参考：
- [1Panel 官方文档](https://1panel.cn/docs/)
- [Docker 部署指南](./DOCKER.md)
- [项目 README](./README.md)