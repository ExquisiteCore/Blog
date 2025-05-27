# blog

**本项目是 EC 的个小站**

# blog
## 简介

一个简单的个人网站采用前后端分离架构

前端使用 Nextjs + React + TypeScript + shadcnui + Tailwind CSS 开发

后端使用 Rust + Axum + Sqlx

数据库使用 postgresql

## 部署方式

### Docker 部署

本项目支持使用 Docker 进行部署，详细说明请参考 [Docker 部署指南](DOCKER.md)。

```bash
# 使用 Docker Compose 启动所有服务
docker-compose up -d
```

### 1Panel + OpenResty 集成部署

如果您使用 1Panel 面板管理服务器，本项目提供了专门的 OpenResty 集成方案：

```bash
# 初始化环境
./deploy-1panel.sh setup

# 构建镜像
./deploy-1panel.sh build

# 启动服务
./deploy-1panel.sh start

# 配置 OpenResty (替换为您的域名)
./deploy-1panel.sh install yourdomain.com
```

详细的 1Panel 集成说明请参考 [1Panel 集成指南](1PANEL-INTEGRATION.md)。

#### 1Panel 集成的优势

- **统一管理**: 通过 1Panel 面板统一管理 Web 服务器配置
- **SSL 自动化**: 利用 1Panel 的 SSL 证书自动申请和更新功能
- **性能优化**: OpenResty 的高性能和 Lua 脚本支持
- **安全增强**: 1Panel 内置的安全防护功能
- **监控便利**: 集成的监控和日志查看功能

## 感谢

本项目开发时，借鉴了以下这些优秀网站（排名不分先后）的很多设计

- [shadcn/ui](https://ui.shadcn.com/)
- [shadcn-vue](https://www.shadcn-vue.com/)
- [付小晨](https://fuxiaochen.com/)

## LICENCE

MIT
