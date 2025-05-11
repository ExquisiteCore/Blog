export interface NavItem {
  href: string;
  label: string;
}

// 主导航项 - 用于头部导航和页脚快速链接
export const mainNavItems: NavItem[] = [
  { href: "/", label: "首页" },
  { href: "/about", label: "关于" },
  { href: "/blog", label: "博客" },
];

// 附加页面链接 - 只在页脚显示
export const additionalPageLinks: NavItem[] = [
  { href: "/sitemap", label: "站点地图" },
];

// 合并两组链接用于页脚显示
export const allFooterLinks: NavItem[] = [
  ...mainNavItems,
  ...additionalPageLinks,
];

// 社交媒体链接
export interface SocialLink extends NavItem {
  icon: string;
  color: string;
}

export const socialLinks: SocialLink[] = [
  {
    href: "https://weibo.com",
    label: "微博",
    icon: "微",
    color: "bg-red-100 text-red-500",
  },
  {
    href: "https://bilibili.com",
    label: "哔哩哔哩",
    icon: "📺",
    color: "bg-pink-100 text-pink-500",
  },
  {
    href: "https://github.com",
    label: "Github",
    icon: "🔗",
    color: "bg-gray-100 text-gray-700",
  },
  {
    href: "#",
    label: "友情链接",
    icon: "🔗",
    color: "bg-green-100 text-green-500",
  },
  {
    href: "https://wx.qq.com",
    label: "微信公众号",
    icon: "📱",
    color: "bg-emerald-100 text-emerald-500",
  },
];
