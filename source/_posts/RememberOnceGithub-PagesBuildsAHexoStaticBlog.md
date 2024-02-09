---
title: 记一次Github Pages搭建Hexo静态博客
date: 2023-12-22 12:53:55
tags: [博客,HEXO]
cover: https://ooo.0x0.ooo/2023/12/22/OKge71.webp
---

# Github Pages搭建Hexo静态博客

## 准备工具

- 一个GitHub账号
- git客户端
- NodeJs V20.10.0
- 你的大脑
- 一个域名(非必要)

## GitHub

1. 创建一个GitHub仓库
   - 仓库名称必须为`你的用户名.github.io`如`ExquisiteCore.github.io`，仓库类型为public
   - ![img](https://ooo.0x0.ooo/2023/12/22/OKZsO1.png)
   - 创建成功后进入下一步

## Hexo

### 一 新建博客

1. 新建一个目录放博客 比如"ExquisiteCoreBlog"

2. 在这个目录打开powershell

3. 安装 hexo

   ```powershell
   #安装 hexo
   npm install -g hexo-cli
   #初始化
   hexo init .
   #安装依赖
   npm install
   #安装git插件
   npm install hexo-deployer-git --save
   ```

   4.有vsocode打开这个目录里的_config.yml进行配置

   最后修改deploy

   格式为：

   ```yaml
   deploy:
     type: git
     repo: 你的仓库地址  #仓库地址请在刚刚GitHub仓库创建成功页面查找
     branch: main 
   ```

### 二 配置博客主题

   我选用[butterfly](https://butterfly.js.org/)

#### 安装butterfly

   在 Hexo 根目录里打开终端

   ```powershell
   git clone -b master https://github.com/jerryc127/hexo-theme-butterfly.git themes/butterfly
   ```

#### 应用主题

   修改 Hexo 根目录下的 _config.yml，把主题改为 butterfly

   ```powershell
   theme: butterfly
   ```

   安装插件

   ```powershell
   npm install hexo-renderer-pug hexo-renderer-stylus --save
   
   npm un hexo-renderer-marked --save # 如果有安装这个的话，卸载
   npm un hexo-renderer-kramed --save # 如果有安装这个的话，卸载
   
   npm i hexo-renderer-markdown-it --save # 需要安装这个渲染插件
   npm install katex @renbaoshuo/markdown-it-katex #需要安装这个katex插件
   ```

   在 hexo 的根目录创建一个文件 _config.butterfly.yml，并把主题目录的_config.yml 内容复制到 _config.butterfly.yml 去。( 注意: 复制的是主题的_config.yml ，而不是 hexo 的 _config.yml)

   注意： 不要把主题目录的 _config.yml 删掉

   注意： 以后只需要在 _config.butterfly.yml 进行配置就行。如果使用了_config.butterfly.yml， 配置主题的 _config.yml 将不会有效果。

   Hexo会自动合併主题中的 _config.yml 和_config.butterfly.yml 里的配置，如果存在同名配置，会使用 _config.butterfly.yml 的配置，其优先度较高。

### 配置域名

   在hexo的根目录下新建一个名为CNAME的文件在里面写入域名

### 常用命令

   ```powershell
   推送： hexo d 本地测试：hexo s 新建文章：hexo new post "文章名称"
   ```
