import { Metadata } from "next";
import BlogPosts from "@/components/BlogPosts";
import type { PostSummary } from "@/types/api";

export const metadata: Metadata = {
  title: "博客",
  description: "ExquisiteCore的技术博客，分享全栈开发、游戏开发和技术思考",
};

function getApiBaseUrl(): string {
  return process.env.INTERNAL_API_BASE_URL || "http://localhost:8080/api";
}

async function getPosts(): Promise<PostSummary[]> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/posts`, {
      next: { revalidate: 60 },
    });

    if (response.ok) {
      const body = await response.json();
      const data = body?.data ?? body;
      if (Array.isArray(data)) return data;
    }
  } catch (error) {
    console.error("获取文章列表失败:", error);
  }
  return [];
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-4 text-center">博客</h1>
      <p className="text-center text-base-content/70 mb-12 max-w-2xl mx-auto">
        这里是我的技术博客，分享全栈开发、游戏开发和各种有趣的技术探索
      </p>
      <BlogPosts posts={posts} />
    </div>
  );
}
