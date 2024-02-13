---
title: 'Hexo: 从butterfly迁移到stellar'
cover: 'https://ooo.0x0.ooo/2023/12/22/OKge71.webp'
tags:
  - 博客
  - HEXO
abbrlink: e04ba162
date: 2024-02-09 17:32:20
---

起因:  用了一段时间butterfly主题，感到不是流畅，偶然间发现了stellar这个简洁的主题（i了i了

{% box %}
{% tabs %}

<!-- tab 稳定版 -->

### **安装stellar**

1. 打开终端并进入博客文件夹，执行：
{% copy npm i hexo-theme-stellar %}

2. 在 `blog/_config.yml` 文件中找到并修改：
{% copy theme: stellar %}

### **迁移友链**

1. 在source/_data/links目录下创建link.yml
2. 修改原butterfly的友链md目录名->friends
3. 修改source/friends/index.md，加入 {% copy {% friends link %}

{% endtabs %}
{% endbox %}

未完持续

{% toc wiki:Stellar 文档目录 display:mobile %}
