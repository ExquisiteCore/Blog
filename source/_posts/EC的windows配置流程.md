---
title: EC的windows配置流程
tags: windows
cover: 'https://ooo.0x0.ooo/2023/12/22/OKge71.webp'
abbrlink: beadb308
date: 2023-12-20 22:10:51
---
# windows配置流程
- 记录一下新电脑的配置流程

## Windows
- 版本win11
#### 一、登录微软账号
- 同步部分OS配置
- 同步edge
- 同步应用商店
- ### 二、转移基本的静态文件
- 所有的图片（壁纸+图标+光标）

- 所有的额外字体文件（Jetbrain和Nerd等宽字体）

- .ssh文件夹（用于登录服务器和GitHub）

- 拷贝windows terminal 的配置文件setting.json，并替换本机windows terminal配置文件。

### 三、下载应用软件

  1. 微软应用商店：[TranslucentTB](https://apps.microsoft.com/detail/9PF4KZ2VN4W9?launch=true&mode=full&referrer=bingwebsearch&ocid=bingwebsearch&hl=zh-cn&gl=US)
  2. 下载并配置[clash-verge](https://github.com/clash-verge-rev/clash-verge-rev)
  3. 网上下载：Google Chrome, QQ, 微信,bandizip, postman, office套件,todesk

### 四、配置开发环境

1. 删除和python默认起冲突的可执行文件。使用管理员权限打开powershell，输入：

```powershell
cd C:\Users\<用户名>\AppData\Local\Microsoft\WindowsApps
rm python*
```

2. 下载git

1. 前往 https://git-scm.com/download/win
2. 配置信息：

```powershell
git config --global user.email xxx
git config --global user.name xxx
```

1. 设置代理:

```powershell
git config --global http.proxy http://127.0.0.1:<7890>
git config --global https.proxy https://127.0.0.1:<7890>
```

3. 安装python

   1. 去 [Python官网](https://www.python.org/downloads/windows/ )寻找稳定版本的x64可执行文件下载

      1. 配置pip源：

      ```powershell
      pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
      pip config set global.proxy http://127.0.0.1:<7890>
      ```

   2. 安装[MinGW ](https://winlibs.com/)

      - 解压并配置环境变量

5. 安装[cmake ](https://cmake.org/download/)

6. 安装node https://nodejs.org/en/download/
   - npm 换源：
   - ```powershell
     npm config set registry https://registry.npm.taobao.org
     ```

6. 安装[Visual Studio](visualstudio.microsoft.com)(主要是配置环境)
   - 勾选c++和.Net,windows通用开发

7. 安装Rust
   - 安装[Rustup](https://static.rust-lang.org/rustup/dist/x86_64-pc-windows-msvc/rustup-init.exe)
   - 将~/.cargo/bin添加到环境变量

8. 测试以上编译器、解释器能否正常工。

9. 安装[vscode](https://code.visualstudio.com/)，安装后打开并登录GitHub账号进行配置与插件同步（等到左下角的“正在同步”消失后，就可以退出了）

### 五、配置终端

以管理员权限打开windows terminal，执行下面的指令

1. 配置 powershell，安装powershell插件

```powershell
# 允许运行Install-Module脚本
set-executionpolicy remotesigned

# 更新最新版本的PSReadLine，为了自动补全
Install-Module PSReadLine -Force

# 创建powershell 的初始化脚本，点击确认创建即可
notepad $profile

# 安装几个插件
Install-Module posh-git
Install-Module Terminal-Icons
```

2. 安装并配置oh-my-posh
   1. 安装oh-my-posh

     ```powershell
     winget install JanDeDobbeleer.OhMyPosh -s winget
     ```

   > 如果该方法失效，移步[oh-my-posh windows set up](https://ohmyposh.dev/docs/installation/windows)查看最新安装方法

   2. 下载oh-my-posh主题

   ```powershell
   git clone https://github.com/JanDeDobbeleer/oh-my-posh 
   ```

   将里面的theme文件夹保留即可。

   3. 测试

   ```powershell
   oh-my-posh init pwsh | Invoke-Expression
   ```

   4. 配置整体运行文件

   ```powershell
   notepad $profile
   ```

   将以下文本写入其中：

   ```powershell
   oh-my-posh init pwsh --config <主题路径（json文件）> | Invoke-Expression
   Import-Module posh-git
   Import-Module Terminal-Icons
   Set-PSReadLineOption -PredictionSource History
   Set-PSReadlineKeyHandler -Key Tab -Function MenuComplete
   cls
   ```

   重新打开terminal查看安装效果
### 六、安装WSL2

以管理员身份打开windows terminal

```powershell
# 开启VM组件 开启后需要重启电脑
Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform

# 安装Ubuntu
wsl --install -d Ubuntu

# 设置为wsl2
wsl --set-default-version 2
```

以上操作完成后，在win+Q中搜索ubuntu on Windows，打开，完成安装和账号注册（Unix账号必须是开头小写的单词）

完成后打开windows terminal的下拉菜单，会发现多出了一个Ubuntu的标签页。后面移步Linux的配置。

### 七、其他的软件

- [Steam](https://store.steampowered.com/about/)
- [MineCraft](www.minecraft.net)
- [原神and星铁](https://github.com/Scighost/Starward)

## Linux

### 一、给apt换源

```shell
cd /etc/apt/

# 留个source备份
sudo mv sources.list sources.list.backup

# 使用源
sudo vim sources.list
```

写入：（根据ubuntu版本号自己查，如果源的版本和ubuntu版本不一致，那么后续更新就会发生依赖问题。e.g. Ubuntu20.04对应focal-XXX的源）

```
deb http://mirrors.aliyun.com/ubuntu/ focal main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ focal-security main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal-security main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ focal-updates main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal-updates main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ focal-proposed main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal-proposed main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ focal-backports main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal-backports main restricted universe multiverse

deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal main restricted universe multiverse
# deb-src https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-updates main restricted universe multiverse
# deb-src https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-updates main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-backports main restricted universe multiverse
# deb-src https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-backports main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-security main restricted universe multiverse
# deb-src https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-security main restricted universe multiverse multiverse
```

保存退出。

移除自带的包（因为可能和国内源的软件有冲突）

```shell
sudo apt remove ubuntu-advantage-tools
```

更新一下：

```shell
sudo apt update
sudo apt upgrade
```

### 二、安装基本的开发工具

```shell
# mingw套组
sudo apt install build-essential cmake 

# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
# python3 pip 工具
sudo apt install python3-pip
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
```

### 三、美化终端（使用zsh）

安装

```
sudo apt install zsh
chsh -s $(which zsh)
```

在bashrc里面加入

```
export SHELL=`which zsh`
[ -z "$ZSH_VERSION" ] && exec "$SHELL" -l
```

重新打开当前终端，就会进入zsh终端，接着安装oh-my-zsh主题框架。

```
cd ~
git clone https://gitee.com/mirrors/oh-my-zsh
sh oh-my-zsh/tools/install.sh
```

安装两个插件

```
cd ~/.oh-my-zsh/custom/plugins/

# 高亮关键词
git clone https://gitee.com/testbook/zsh-syntax-highlighting.git

# 自动补全
git clone https://gitee.com/qiushaocloud/zsh-autosuggestions

# 更加丰富的高亮
git clone https://gitee.com/wangl-cc/fast-syntax-highlighting

# 展示自动补全历史
git clone https://gitee.com/wenhuifu/zsh-autocomplete
```

然后进入`~/.zshrc`在plugins参数中添加`zsh-syntax-highlighting`和`zsh-autosuggestions`。也就是说你的.zshrc中必须要有一行长这样：

```
plugins=(git zsh-syntax-highlighting zsh-autosuggestions fast-syntax-highlighting zsh-autocomplete)
```

### 四、安装部分驱动程序

默认pip 版本较低，升级一下

```
pip install --upgrade pip
```