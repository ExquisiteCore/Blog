import { Wrapper } from "@/components/wrapper";
import { BlogList } from "@/components/blog/blog-list";
import { get } from "@/lib/http";
import { BlogPost } from "@/components/blog/blog-card";

// 从API获取博客文章数据
async function fetchPosts(): Promise<BlogPost[]> {
  try {
    const posts = await get<BlogPost[]>('/posts', { withToken: false });
    return posts;
  } catch (error) {
    console.error('获取文章列表失败:', error);
    return [];
  }
}

export default async function Page() {
  // 使用封装的axios从/api/posts获取文章数据
  const posts = await fetchPosts();

  return (
    <Wrapper className="flex min-h-screen flex-col px-6 pb-24 pt-8">
      <h2 className="pb-8 text-3xl font-bold md:text-4xl">最新文章</h2>
      <BlogList posts={posts} className="pb-8" />
    </Wrapper>
  );
}