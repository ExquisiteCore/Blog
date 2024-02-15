---
title: life
date: 2024-02-09 19:01:09
menu_id: post #侧边栏首页高亮
breadcrumb: false # 隐藏面包屑导航
post_list: true # 显示首页导航
---

{% note color:orange 分享自己的生活碎片！ %}

{% timeline api:https://api.github.com/repos/ExquisiteCore/ExquisiteCore.github.io/issues?direction=asc&per_page=30 %}{% endtimeline %}

{% timeline api:https://memos.xaox.cc/api/v1/memo?creatorId=3&limit=10 type:memos avatar:/assets/xaoxuu/avatar/rect-256@2x.png %}
{% endtimeline %}