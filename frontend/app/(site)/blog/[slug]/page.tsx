import { Metadata } from "next";
import BlogPost from "@/components/BlogPost";
import type { PostDetail } from "@/types/api";

function getApiBaseUrl(): string {
  return process.env.INTERNAL_API_BASE_URL || "http://localhost:8080/api";
}

async function getPost(slug: string): Promise<PostDetail | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/posts/${slug}`, {
      next: { revalidate: 60 },
    });

    if (response.ok) {
      const body = await response.json();
      // 解包 ApiResponse
      return body?.data || body;
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
    const coverImage = post.cover_images && post.cover_images.length > 0 ? post.cover_images[0] : null;
    return {
      title: post.title,
      description: post.summary || `阅读ExquisiteCore的文章：${post.title}`,
      keywords: `${post.title},${post.labels?.join(",") || ""},ExquisiteCore,技术博客`,
      openGraph: {
        title: post.title,
        description: post.summary || `阅读ExquisiteCore的文章：${post.title}`,
        type: "article",
        publishedTime: post.published_at || undefined,
        modifiedTime: post.updated_at,
        authors: ["ExquisiteCore"],
        tags: post.labels || [],
        images: coverImage ? [coverImage] : [],
        url: `https://blog.exquisitecore.xyz/blog/${post.slug}`,
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: post.summary || `阅读ExquisiteCore的文章：${post.title}`,
        images: coverImage ? [coverImage] : [],
      },
      alternates: {
        canonical: `https://blog.exquisitecore.xyz/blog/${post.slug}`,
      },
    };
  }

  return {
    title: "博客文章",
    description: "ExquisiteCore的技术博客文章",
  };
}

// 生成 Article JSON-LD 结构化数据
function generateArticleJsonLd(post: PostDetail) {
  const coverImage = post.cover_images && post.cover_images.length > 0 ? post.cover_images[0] : null;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.summary || `阅读ExquisiteCore的文章：${post.title}`,
    image: coverImage || "https://blog.exquisitecore.xyz/logo.svg",
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
      "@id": `https://blog.exquisitecore.xyz/blog/${post.slug}`,
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
