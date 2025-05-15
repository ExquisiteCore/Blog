import { createResource, For, Show } from 'solid-js';
import http from '@/lib/axios';

// 定义文章接口
interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  published: boolean;
  author_id: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  labels: string[];
}

// 格式化日期函数
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// 获取文章数据的函数
async function fetchPosts(): Promise<Post[]> {
  try {
    const response = await http.get<Post[]>("/posts", { withToken: false });

    // 检查响应格式，直接处理返回的数组数据
    if (response && Array.isArray(response)) {
      // 成功获取数据，API直接返回了文章数组
      return response.map((post) => ({
        ...post,
        featured_image: post.featured_image
          ? post.featured_image.replace(/`/g, "").trim()
          : null,
      }));
    } else {
      // 响应格式不符合预期
      console.error('API响应格式不符合预期:', response);
      return [];
    }
  } catch (error) {
    console.error('获取文章失败:', error);
    return [];
  }
}

export default function BlogPosts() {
  // 使用SolidJS的资源加载功能获取文章
  const [posts] = createResource<Post[]>(fetchPosts);
  return (
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-8">
      <Show when={!posts.loading} fallback={<div class="col-span-full text-center">加载中...</div>}>
        <Show
          when={posts() && posts()!.length > 0}
          fallback={
            <div class="col-span-full text-center py-12">
              <div class="alert alert-info shadow-lg max-w-md mx-auto">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  class="stroke-current shrink-0 w-6 h-6"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>暂无文章，敬请期待！</span>
              </div>
            </div>
          }
        >
          <For each={posts()}>
            {(post) => (
              <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                {post.featured_image && post.featured_image.trim() !== "" && (
                  <figure>
                    <img src={post.featured_image} alt={post.title} class="w-full h-48 object-cover" />
                  </figure>
                )}
                <div class="card-body">
                  <h2 class="card-title">{post.title}</h2>
                  <p class="text-sm opacity-70">{formatDate(post.published_at)}</p>
                  <p class="mt-2">{post.excerpt || ""}</p>
                  {post.labels && post.labels.length > 0 && (
                    <div class="card-actions justify-start mt-3">
                      {post.labels.map((tag) => (
                        <div class="badge badge-outline">{tag}</div>
                      ))}
                    </div>
                  )}
                  <div class="card-actions justify-end mt-4">
                    <a href={`/blog/${post.id}`} class="btn btn-primary btn-sm">阅读更多</a>
                  </div>
                </div>
              </div>
            )}
          </For>
        </Show>
      </Show>
    </div>
  );
}