import type { APIRoute } from 'astro';

// 静态页面配置
const staticPages = [
  { url: '', priority: '1.0', changefreq: 'weekly' },
  { url: 'about', priority: '0.8', changefreq: 'monthly' },
  { url: 'projects', priority: '0.8', changefreq: 'monthly' },
  { url: 'blog', priority: '0.9', changefreq: 'weekly' },
  { url: 'tools', priority: '0.7', changefreq: 'monthly' },
  { url: 'tools/markdownrender', priority: '0.6', changefreq: 'monthly' },
];

// 获取博客文章列表（这里需要根据实际API调整）
async function getBlogPosts() {
  try {
    // 这里应该调用你的博客API来获取文章列表
    // 暂时返回空数组，你可以根据实际情况修改
    const response = await fetch('http://localhost:8080/api/posts');
    if (response.ok) {
      const posts = await response.json();
      return posts.map((post: any) => ({
        url: `blog/${post.slug}`,
        priority: '0.8',
        changefreq: 'monthly',
        lastmod: post.updatedAt || post.createdAt,
      }));
    }
  } catch (error) {
    console.warn('Failed to fetch blog posts for sitemap:', error);
  }
  return [];
}

export const GET: APIRoute = async ({ site }) => {
  const blogPosts = await getBlogPosts();
  const allPages = [...staticPages, ...blogPosts];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map((page) => {
    const url = new URL(page.url, site).href;
    const lastmod = page.lastmod
      ? new Date(page.lastmod).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  })
  .join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
};
