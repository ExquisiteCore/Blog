import { Metadata } from "next";
import BlogPost from "@/components/BlogPost";

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  published: boolean;
  author_id: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  labels: string[];
}

async function getPost(slug: string): Promise<Post | null> {
  try {
    const apiUrl =
      process.env.INTERNAL_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "https://api.exquisitecore.xyz/api";

    const response = await fetch(`${apiUrl}/posts/${slug}`, {
      next: { revalidate: 60 },
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error("获取文章失败:", error);
  }
  return null;
}

// 动态生成 SEO 信息
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (post) {
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
        authors: ["ExquisiteCore"],
        tags: post.labels || [],
        images: post.featured_image ? [post.featured_image] : [],
        url: `https://blog.exquisitecore.xyz/blog/${post.id}`,
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: post.excerpt || `阅读ExquisiteCore的文章：${post.title}`,
        images: post.featured_image ? [post.featured_image] : [],
      },
      alternates: {
        canonical: `https://blog.exquisitecore.xyz/blog/${post.id}`,
      },
    };
  }

  return {
    title: "博客文章",
    description: "ExquisiteCore的技术博客文章",
  };
}

// 生成 Article JSON-LD 结构化数据
function generateArticleJsonLd(post: Post) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || `阅读ExquisiteCore的文章：${post.title}`,
    image: post.featured_image || "https://blog.exquisitecore.xyz/logo.svg",
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: {
      "@type": "Person",
      name: "ExquisiteCore",
      url: "https://blog.exquisitecore.xyz/about",
    },
    publisher: {
      "@type": "Organization",
      name: "ExquisiteCore Blog",
      logo: {
        "@type": "ImageObject",
        url: "https://blog.exquisitecore.xyz/logo.svg",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://blog.exquisitecore.xyz/blog/${post.id}`,
    },
    keywords: post.labels?.join(", ") || "",
    articleSection: "技术博客",
    inLanguage: "zh-CN",
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  return (
    <>
      {post && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateArticleJsonLd(post)),
          }}
        />
      )}
      <BlogPost slug={slug} />
    </>
  );
}
