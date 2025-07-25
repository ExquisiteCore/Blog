import type { APIRoute } from 'astro';

const getRobotsTxt = (sitemapURL: URL) => `
User-agent: *
Allow: /

# 优化爬虫访问
Crawl-delay: 1

# 站点地图
Sitemap: ${sitemapURL.href}

# 禁止访问的路径（如果有的话）
# Disallow: /admin/
# Disallow: /api/
`;

export const GET: APIRoute = ({ site }) => {
  const sitemapURL = new URL('sitemap-index.xml', site);
  return new Response(getRobotsTxt(sitemapURL));
};
