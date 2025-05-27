# 1Panel + OpenResty 集成指南

本文档详细说明如何将博客系统与1Panel面板的OpenResty服务集成，实现统一的Web服务器管理。

## 目录

- [概述](#概述)
- [前提条件](#前提条件)
- [集成方案](#集成方案)
- [快速开始](#快速开始)
- [详细配置](#详细配置)
- [SSL证书配置](#ssl证书配置)
- [监控与维护](#监控与维护)
- [故障排除](#故障排除)
- [最佳实践](#最佳实践)

## 概述

### 架构说明

通过1Panel的OpenResty作为反向代理，博客系统的架构如下：

```
Internet
    ↓
1Panel OpenResty (Port 80/443)
    ↓
┌─────────────────────────────┐
│  Docker 容器网络             │
│  ┌─────────────────────────┐ │
│  │ Frontend (Port 4321)    │ │
│  └─────────────────────────┘ │
│  ┌─────────────────────────┐ │
│  │ Backend (Port 8080)     │ │
│  └─────────────────────────┘ │
│  ┌─────────────────────────┐ │
│  │ PostgreSQL (Port 5432)  │ │
│  └─────────────────────────┘ │
│  ┌─────────────────────────┐ │
│  │ Redis (Port 6379)       │ │
│  └─────────────────────────┘ │
└─────────────────────────────┘
```

### 优势

- **统一管理**: 通过1Panel面板统一管理Web服务器配置
- **SSL自动化**: 利用1Panel的SSL证书自动申请和更新功能
- **性能优化**: OpenResty的高性能和Lua脚本支持
- **安全增强**: 1Panel内置的安全防护功能
- **监控便利**: 集成的监控和日志查看功能

## 前提条件

### 系统要求

- **操作系统**: Ubuntu 20.04+ / CentOS 7+ / Debian 10+
- **内存**: 最少 4GB RAM (推荐 8GB)
- **CPU**: 最少 2 核心 (推荐 4 核心)
- **磁盘**: 最少 20GB 可用空间

### 必需软件

1. **1Panel面板**: 已安装并正常运行
2. **OpenResty**: 通过1Panel应用商店安装
3. **Docker**: >= 20.10
4. **Docker Compose**: >= 2.0

### 验证安装

```bash
# 检查1Panel状态
systemctl status 1panel

# 检查OpenResty状态
docker ps | grep openresty

# 检查Docker版本
docker --version
docker-compose --version
```

## 集成方案

### 方案选择

我们提供了专门的1Panel集成配置，相比标准Docker部署的主要区别：

| 配置项 | 标准部署 | 1Panel集成 |
|--------|----------|------------|
| 反向代理 | 内置Nginx容器 | 1Panel OpenResty |
| 端口绑定 | 公网端口 | 本地端口 (127.0.0.1) |
| SSL管理 | 手动配置 | 1Panel自动管理 |
| 配置管理 | 文件编辑 | 1Panel面板 + 文件 |
| 监控日志 | Docker logs | 1Panel + Docker logs |

### 文件说明

- `docker-compose.1panel.yml`: 1Panel专用的Docker Compose配置
- `1panel-configs/blog-site.conf`: OpenResty站点配置文件
- `deploy-1panel.sh`: 1Panel集成部署脚本

## 快速开始

### 1. 克隆项目

```bash
git clone <仓库地址>
cd Blog
```

### 2. 初始化环境

```bash
# 设置环境配置
./deploy-1panel.sh setup

# 或手动创建
cp .env.example .env
```

### 3. 配置环境变量

编辑 `.env` 文件，更新以下配置：

```bash
# 数据库配置
POSTGRES_PASSWORD=your_secure_password
POSTGRES_USER=postgres
POSTGRES_DB=Blog

# JWT密钥
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters

# API配置 (替换为您的域名)
PUBLIC_API_BASE_URL=https://yourdomain.com/api
INTERNAL_API_BASE_URL=http://backend:8080/api

# Redis密码
REDIS_PASSWORD=secure_redis_password
```

### 4. 构建和启动服务

```bash
# 构建Docker镜像
./deploy-1panel.sh build

# 启动博客服务
./deploy-1panel.sh start
```

### 5. 配置OpenResty

```bash
# 安装OpenResty配置 (替换为您的域名)
./deploy-1panel.sh install yourdomain.com
```

### 6. 验证部署

```bash
# 检查服务状态
./deploy-1panel.sh health

# 查看服务状态
./deploy-1panel.sh status
```

## 详细配置

### Docker Compose 配置

`docker-compose.1panel.yml` 的关键配置说明：

#### 端口绑定策略

```yaml
ports:
  - "127.0.0.1:4321:4321"  # 仅绑定到本地
  - "127.0.0.1:8080:8080"  # 防止外部直接访问
  - "127.0.0.1:5432:5432"
```

#### 网络配置

```yaml
networks:
  blog-network:
    driver: bridge  # 内部网络通信
```

#### 资源限制

```yaml
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
```

### OpenResty 配置

#### 主要配置块

1. **HTTP到HTTPS重定向**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

2. **HTTPS主配置**
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    # SSL配置...
}
```

3. **API路由**
```nginx
location /api/ {
    limit_req zone=blog_api burst=20 nodelay;
    proxy_pass http://127.0.0.1:8080;
    # 代理配置...
}
```

4. **前端路由**
```nginx
location / {
    proxy_pass http://127.0.0.1:4321;
    # 代理配置...
}
```

#### 安全配置

```nginx
# 安全头
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options DENY always;
add_header X-Content-Type-Options nosniff always;

# 速率限制
limit_req_zone $binary_remote_addr zone=blog_api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=blog_login:10m rate=1r/s;

# 阻止恶意请求
location ~* (wp-admin|wp-login|xmlrpc|\.php$) {
    deny all;
    return 444;
}
```

## SSL证书配置

### 通过1Panel管理SSL

1. **登录1Panel面板**
   - 访问 `https://your-server-ip:10086`
   - 使用管理员账户登录

2. **配置域名**
   - 进入 `网站` → `网站管理`
   - 添加新网站，设置域名
   - 选择 `反向代理` 类型

3. **申请SSL证书**
   - 在网站详情页面点击 `SSL`
   - 选择 `Let's Encrypt` 或上传自己的证书
   - 点击申请并等待完成

4. **更新配置路径**

   编辑 `1panel-configs/blog-site.conf`，更新SSL证书路径：
   ```nginx
   ssl_certificate /opt/1panel/apps/openresty/openresty/conf/ssl/yourdomain.com/cert.pem;
   ssl_certificate_key /opt/1panel/apps/openresty/openresty/conf/ssl/yourdomain.com/key.pem;
   ```

### 手动配置SSL

如果需要手动配置SSL证书：

```bash
# 创建SSL目录
sudo mkdir -p /opt/1panel/apps/openresty/openresty/conf/ssl/yourdomain.com

# 复制证书文件
sudo cp your-cert.pem /opt/1panel/apps/openresty/openresty/conf/ssl/yourdomain.com/cert.pem
sudo cp your-key.pem /opt/1panel/apps/openresty/openresty/conf/ssl/yourdomain.com/key.pem

# 设置权限
sudo chown -R 1001:1001 /opt/1panel/apps/openresty/openresty/conf/ssl/
sudo chmod 600 /opt/1panel/apps/openresty/openresty/conf/ssl/yourdomain.com/*
```

## 监控与维护

### 日志管理

#### 查看应用日志

```bash
# 查看所有服务日志
./deploy-1panel.sh logs

# 查看特定服务日志
./deploy-1panel.sh logs backend
./deploy-1panel.sh logs frontend
./deploy-1panel.sh logs postgres
```

#### 查看OpenResty日志

```bash
# 访问日志
sudo tail -f /opt/1panel/apps/openresty/openresty/logs/blog_access.log

# 错误日志
sudo tail -f /opt/1panel/apps/openresty/openresty/logs/blog_error.log

# 1Panel系统日志
sudo journalctl -u 1panel -f
```

### 性能监控

#### 通过1Panel面板

1. 进入 `监控` → `系统监控`
2. 查看CPU、内存、磁盘使用情况
3. 查看网络流量统计

#### 命令行监控

```bash
# 查看Docker容器资源使用
docker stats

# 查看系统资源
htop
iotop

# 查看网络连接
netstat -tulpn | grep -E "(80|443|4321|8080)"
```

### 备份策略

#### 自动备份脚本

创建定时备份任务：

```bash
# 编辑crontab
crontab -e

# 添加以下行 (每天凌晨2点备份)
0 2 * * * cd /path/to/Blog && ./deploy-1panel.sh backup
```

#### 手动备份

```bash
# 备份数据库
./deploy-1panel.sh backup

# 备份配置文件
tar -czf config_backup_$(date +%Y%m%d).tar.gz .env 1panel-configs/ nginx/
```

## 故障排除

### 常见问题

#### 1. 服务无法启动

**症状**: Docker容器启动失败

**排查步骤**:
```bash
# 查看容器状态
docker-compose -f docker-compose.1panel.yml ps

# 查看具体错误
docker-compose -f docker-compose.1panel.yml logs

# 检查端口占用
netstat -tulpn | grep -E "(4321|8080|5432)"
```

**解决方案**:
- 检查端口是否被占用
- 确认环境变量配置正确
- 检查磁盘空间是否充足

#### 2. OpenResty配置错误

**症状**: 网站无法访问，502错误

**排查步骤**:
```bash
# 测试配置语法
docker exec 1panel-openresty nginx -t

# 查看OpenResty日志
docker logs 1panel-openresty

# 检查后端服务是否正常
curl http://127.0.0.1:4321
curl http://127.0.0.1:8080/health
```

**解决方案**:
```bash
# 重载配置
./deploy-1panel.sh reload-nginx

# 重启OpenResty
docker restart 1panel-openresty
```

#### 3. SSL证书问题

**症状**: HTTPS无法访问，证书错误

**排查步骤**:
```bash
# 检查证书文件
sudo ls -la /opt/1panel/apps/openresty/openresty/conf/ssl/yourdomain.com/

# 检查证书有效期
openssl x509 -in /path/to/cert.pem -text -noout | grep -A 2 "Validity"

# 测试SSL配置
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

**解决方案**:
- 通过1Panel重新申请证书
- 检查域名解析是否正确
-
确认证书文件路径和权限

#### 4. 数据库连接失败

**症状**: 后端API返回数据库连接错误

**排查步骤**:
```bash
# 检查数据库状态
docker-compose -f docker-compose.1panel.yml exec postgres pg_isready

# 查看数据库日志
docker-compose -f docker-compose.1panel.yml logs postgres

# 测试连接
docker-compose -f docker-compose.1panel.yml exec postgres psql -U postgres -d Blog
```

**解决方案**:
- 检查数据库密码是否正确
- 确认数据库服务是否正常启动
- 检查网络连接

### 性能优化

#### OpenResty优化

在 `1panel-configs/blog-site.conf` 中添加：

```nginx
# 启用HTTP/2
listen 443 ssl http2;

# 增加worker连接数
worker_connections 2048;

# 启用gzip压缩
gzip on;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript;

# 设置缓存
location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

#### 数据库优化

在环境变量中添加PostgreSQL优化参数：

```bash
# 在 docker-compose.1panel.yml 中添加
environment:
  - POSTGRES_SHARED_BUFFERS=256MB
  - POSTGRES_MAX_CONNECTIONS=100
  - POSTGRES_EFFECTIVE_CACHE_SIZE=1GB
```

## 最佳实践

### 安全建议

1. **定期更新**
   ```
bash
   # 更新系统包
   sudo apt update && sudo apt upgrade
   
   # 更新Docker镜像
   docker-compose -f docker-compose.1panel.yml pull
   
   # 更新应用
   ./deploy-1panel.sh update
   ```

2. **访问控制**
   - 使用强密码
   - 启用防火墙
   - 限制SSH访问
   - 定期审查访问日志

3. **数据保护**
   - 定期备份数据库
   - 加密敏感数据
   - 使用HTTPS
   - 设置适当的文件权限

### 运维建议

1. **监控检查**
   - 设置资源使用率告警
   - 监控服务可用性
   - 检查日志异常

2. **容量规划**
   - 定期检查磁盘使用
   - 监控数据库大小
   - 规划扩容策略

3. **文档维护**
   - 记录配置变更
   - 更新部署文档
   - 维护故障处理手册

### 开发环境配置

对于开发环境，可以简化配置：

```bash
# 使用开发环境配置
cp .env.example .env.dev

# 修改API地址为本地
PUBLIC_API_BASE_URL=http://localhost:8080/api
INTERNAL_API_BASE_URL=http://backend:8080/api

# 启用开发模式
NODE_ENV=development
RUST_LOG=debug
```

### 生产环境清单

部署到生产环境前的检查清单：

- [ ] 环境变量已正确配置
- [ ] SSL证书已配置并有效
- [ ] 数据库密码已更改
- [ ] JWT密钥已生成
- [ ] 防火墙规则已配置
- [ ] 备份策略已实施
- [ ] 监控告警已设置
- [ ] 域名解析已配置
- [ ] 性能测试已完成

---

如需更多帮助，请参考：
- [1Panel官方文档](https://1panel.io/docs/)
- [OpenResty官方文档](http://openresty.org/)
- [项目GitHub仓库](https://github.com/your-repo)