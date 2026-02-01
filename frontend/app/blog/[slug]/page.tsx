import { Metadata } from "next";
import BlogPost from "@/components/BlogPost";

// 动态生成 SEO 信息
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const apiUrl = process.env.INTERNAL_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "https://api.exquisitecore.xyz/api";

    const response = await fetch(`${apiUrl}/posts/${slug}`, {
      next: { revalidate: 60 },
    });

    if (response.ok) {
      const post = await response.json();
      return {
        title: post.title,
        description: post.excerpt || `阅读ExquisiteCore的文章：${post.title}`,
        keywords: `${post.title},${post.labels?.join(",") || ""},ExquisiteCore,技术博客`,
        openGraph: {
          title: post.title,
          description: post.excerpt || `阅读ExquisiteCore的文章：${post.title}`,
          type: "article",
          publishedTime: post.published_at,
          modifiedTime: post.updated_at,
          tags: post.labels || [],
          images: post.featured_image ? [post.featured_image] : [],
        },
      };
    }
  } catch (error) {
    console.error("获取文章元数据失败:", error);
  }

  return {
    title: "博客文章",
    description: "ExquisiteCore的技术博客文章",
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <BlogPost slug={slug} />;
}
