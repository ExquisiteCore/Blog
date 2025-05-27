# 1Panel OpenResty 配置步骤指南

## 📋 配置前准备

在开始配置之前，请确保：

✅ 1Panel面板已安装并运行  
✅ OpenResty应用已通过1Panel应用商店安装  
✅ 博客Docker服务已启动（端口4321和8080可访问）  
✅ 域名已解析到服务器IP  

## 🚀 第一步：启动博客服务

```bash
# 进入项目目录
cd /path/to/Blog

# 初始化环境
./deploy-1panel.sh setup

# 构建并启动服务
./deploy-1panel.sh build
./deploy-1panel.sh start

# 验证服务运行
./deploy-1panel.sh health
```

## 🌐 第二步：在1Panel中创建网站

### 2.1 登录1Panel面板

1. 浏览器访问：`https://your-server-ip:10086`
2. 使用管理员账户登录

### 2.2 创建反向代理网站

1. 进入 **网站** → **网站管理**
2. 点击 **创建网站** 按钮
3. 填写网站信息：
   - **类型**：选择 `反向代理`
   - **主域名**：填写您的域名（如：`example.com`）
   - **代理地址**：填写 `http://127.0.0.1:4321`
   - **备注**：`博客系统前端`

### 2.3 添加自定义配置

在创建页面或网站编辑页面中：

1. 找到 **自定义配置** 或 **高级配置** 选项
2. 复制下面的配置内容并粘贴：

```nginx
# 请求体大小限制
client_max_body_size 10M;

# 速率限制定义
limit_req_zone $binary_remote_addr zone=blog_api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=blog_login:10m rate=1r/s;

# API路由配置
location /api/ {
    limit_req zone=blog_api burst=20 nodelay;
    
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    
    # 超时设置
    proxy_connect_timeout 30s;
    proxy_send_timeout 30s;
    proxy_read_timeout 30s;
    
    # 错误处理
    proxy_next_upstream error timeout invalid_header http_500 http_502 http_503;
}

# 登录接口限流
location /api/auth/login {
    limit_req zone=blog_login burst=5 nodelay;
    
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# 静态资源缓存
location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg)$ {
    proxy_pass http://127.0.0.1:4321;
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header X-Cache-Status "STATIC";
}

# 健康检查端点
location /health {
    access_log off;
    return 200 "healthy\n";
    add_header Content-Type text/plain;
}

# 安全防护
location ~ /\. {
    deny all;
    access_log off;
    log_not_found off;
}

location ~* (wp-admin|wp-login|xmlrpc|admin|phpmyadmin|\.php$) {
    deny all;
    access_log off;
    log_not_found off;
    return 444;
}

location ~* \.(env|git|svn|htaccess|htpasswd)$ {
    deny all;
    access_log off;
    log_not_found off;
    return 444;
}
```

3. 点击 **创建** 完成网站创建

## 🔒 第三步：配置SSL证书

### 3.1 使用Let's Encrypt免费证书（推荐）

1. 网站创建成功后，进入网站详情页面
2. 点击 **SSL** 标签页
3. 选择 **Let's Encrypt**
4. 填写邮箱地址
5. 点击 **申请** 并等待完成
6. 1Panel会自动配置HTTPS重定向

### 3.2 上传自有SSL证书

1. 在SSL页面选择 **其他证书**
2. 上传证书文件（.crt 或 .pem）
3. 上传私钥文件（.key）
4. 点击 **保存**

## ✅ 第四步：验证配置

### 4.1 测试网站访问

```bash
# 测试HTTP（应该重定向到HTTPS）
curl -I http://yourdomain.com

# 测试HTTPS
curl -I https://yourdomain.com

# 测试API接口
curl https://yourdomain.com/api/health
```

### 4.2 检查服务状态

```bash
# 检查博客服务
./deploy-1panel.sh status

# 查看日志
./deploy-1panel.sh logs
```

### 4.3 1Panel面板检查

1. 在 **网站管理** 中查看网站状态
2. 检查SSL证书有效期
3. 查看访问日志和错误日志

## 🛠️ 常见问题解决

### 问题1：502 Bad Gateway

**原因**：后端服务未启动或端口不通

**解决**：
```bash
# 检查服务状态
docker ps
./deploy-1panel.sh health

# 重启服务
./deploy-1panel.sh restart
```

### 问题2：SSL证书申请失败

**原因**：域名解析未生效或端口80被占用

**解决**：
1. 检查域名解析：`nslookup yourdomain.com`
2. 确保端口80可访问
3. 临时停止其他Web服务

### 问题3：API接口无法访问

**原因**：后端服务未启动或配置错误

**解决**：
```bash
# 检查后端服务
curl http://127.0.0.1:8080/health

# 查看后端日志
./deploy-1panel.sh logs backend
```

## 📝 配置完成检查清单

- [ ] 博客Docker服务正常运行
- [ ] 1Panel网站创建成功
- [ ] 自定义配置已添加
- [ ] SSL证书申请并配置成功
- [ ] HTTP自动重定向到HTTPS
- [ ] 前端页面可正常访问
- [ ] API接口可正常访问
- [ ] 静态资源缓存正常
- [ ] 安全防护规则生效

## 🔄 后续维护

### 定期备份

```bash
# 数据库备份
./deploy-1panel.sh backup

# 配置备份
cp .env .env.backup
```

### 更新应用

```bash
# 更新博客应用
./deploy-1panel.sh update
```

### 监控检查

1. 定期查看1Panel监控面板
2. 检查SSL证书到期时间
3. 查看访问日志和错误日志
4. 监控服务器资源使用情况

---

🎉 恭喜！您的博客系统已成功部署并配置完成！

如有问题，请参考 [1PANEL-INTEGRATION.md](1PANEL-INTEGRATION.md) 获取更详细的说明。