---
title: QQ机器人openShamrock搭建
date: 2023-12-23 14:53:23
tags: QQ机器人
---

# 搭建QQ机器人

## 准备工具

- 一台安卓或docker环境
- 下载[OpenShamrock](https://github.com/whitechi73/OpenShamrock/actions/workflows/build-apk.yml)

<blockquote> 
有三种安装方法，安卓请根据无ROOT环境和有ROOT环境选择或者选择docker
</blockquote>

### 支持的QQ版本

- 版本 `8.9.68`，`8.9.70`，`8.9.73`，`8.9.75`，`8.9.78`，`8.9.80`，`8.9.81`，`8.9.83`
- 理论上支持上述说明未提到的更高版本，如遇问题请提交issue

# 一，安装OpenShamrock

## 安卓手机无ROOT环境

#### 使用 LSPatch

- 打开 LSPatch 并在`管理`页面选择 `+` 新建修补，可以选择从存储目录选择QQAPK或者直接使用已经安装过的QQ
- 修补模式默认且应该优先选择`本地模式`，这样方便直接更新 Shamrock 模块而不用重新修补，缺点是需要 LSPatch 保持后台运行
- 其他配置保持默认，然后点击`开始修补`，修补完成后会提示安装(如果已经安装会提示卸载)
- 安装 Shamrock 模块后在`管理`页面点击修补好的 QQ 选择`模块作用域` 勾选上 Shamrock 模块然后保存
- 启动 Shamrock 并`重新启动 QQ 客户端`
- 此时 Shamrock 会显示已激活

> 使用本地模式修补后需要保持LSPatch在后台运行，优点是模块更新无需重新修补QQ 使用集成模式修补后无需保持LSPatch在后台运行，缺点是模块更新后需要重新修补QQ


## 安卓手机有ROOT环境

- 打开 QQ 客户端，登录你的 QQ 账号
- 安装 Shamrock 并在 Xposed 启用 Shamrock 模块，如果使用 LSPosed 则需要勾选模块作用域(默认QQ)
- 启动 Shamrock 并`重新启动 QQ 客户端`，如果环境为 Xposed 则需要重启手机
- 此时 Shamrock 会显示已激活(需要成功登陆，才会显示已激活)

## Docker
这个选择过于多元化，你可以使用redroid、docker-android，需要注意的是部分框架要求开起虚拟化才能使用哦！目前依旧是采用Lspatch+Shamrock方案在docker部署，因为安装magisk类需要修补镜像，难以实现。

# 二，配置

> Shamrock 提供了一个图形化的配置界面，可进行简单的配置操作。

## 配置选项

### 强制平板模式强制平板模式

让 QQ 客户端 识别设备为平板，使其账号可在安卓和平板同时在线。


> 除了 WebSocket 相关功能，其他功能的配置进行修改立即生效，无需重新启动QQ。 不建议使用 CQ 码，因为在新一代机器人设计理念中，该操作过于落后，可能会出现许多问题。

> 被动 WebSocket 在断线之后，每隔 5 秒尝试重新连接。


## 目录定义

- 内部存储目录: `/storage/emulated/0` # 或 `/sdcard`
- QQ 主目录: `内部存储目录 + /Android/data/com.tencent.mobileqq`
- Shamrock 主目录: `QQ主目录 + /Tencent/Shamrock`

## 配置文件

将下方 JSON 文件创建在 `Shamrock 主目录 + /config.json`
请确保 JSON 格式正确。

```json
{
    "rules": {
        "group_rule": {
            "black_list": [12345678], // 如果群号是`12345678`就跳过了哦！
            "white_list": []
        },
        "private_rule": {
            "black_list": [12345678],
            "white_list": []
        }
    },
    "default_token": null,
    "active_websocket": {
        "port": 5800, // 主动WS监听的端口
        "token": "aaaa1111,bbbb1111", // 同时允许两个token可使用|或,作为分割
        "heartbeat_interval": 15000 // 设置为null则默认15000毫秒作为心跳间隔，0则为无心跳
    },
    "passive_websocket": [
        {
            "address": "ws://xxxxxxxxx" // 这里是个例子，如果默认tk存在则使用默认token鉴权
        },
        {
            "address": "ws://aaaaaaaaa",
            "token": "aaa666", // 提供了特例化token，将不使用默认token
            "heartbeat_interval": 15000 // 设置为null则默认15000毫秒作为心跳间隔，0则为无心跳
        }
    ],
    "allow-temp-session": false // 是否允许临时消息
}
```

| 参数名称      | 类型   | 作用                                                         | 例子      |
| ------------- | ------ | ------------------------------------------------------------ | --------- |
| default_token | string | 默认token，**HTTP接口/主被动WS** 如果未单独定义token，则使用默认token | aaa123456 |

> 记得把注释删掉哦？JSON5貌似也没有完全支持呢？该配置文件采用Json5标准！

## WebSocket认证方法

在HTTP Upgrade请求头中添加access_token或ticket或Authorization头

例：

```text
GET / HTTP/1.1
Host: 192.168.3.4
Upgrade: websocket
Connection: upgrade
Sec-WebSocket-Key: wwwwwwwwwwwwwwwwwwwwww==
Sec-WebSocket-Version: 13
Authorization: aaaa1111
```

## 数据目录数据目录

大部分 Shamrock 的数据/缓存保存在 `Shamrock 主目录`
其中的日志可作为 Issue 内容，截取部分提交。

```bash
├── tmpfiles # 临时文件目录
│   ├── logs # 日志目录
│   │   └── xxx.log # 日志文件
├── config.json # 配置文件
```
