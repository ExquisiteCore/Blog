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
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// 获取文章数据的函数
async function fetchPosts(): Promise<Post[]> {
  try {
    const response = await http.get<Post[]>('/posts', { withToken: false });

    // 检查响应格式，直接处理返回的数组数据
    if (response && Array.isArray(response)) {
      // 成功获取数据，API直接返回了文章数组
      return response.map((post) => ({
        ...post,
        featured_image: post.featured_image
          ? post.featured_image.replace(/`/g, '').trim()
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
    <div class="my-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Show
        when={!posts.loading}
        fallback={<div class="col-span-full text-center">加载中...</div>}
      >
        <Show
          when={posts() && posts()!.length > 0}
          fallback={
            <div class="col-span-full py-12 text-center">
              <div class="mx-auto alert max-w-md alert-info shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  class="h-6 w-6 shrink-0 stroke-current"
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
              <div class="card bg-base-100 shadow-xl transition-shadow duration-300 hover:shadow-2xl">
                {post.featured_image && post.featured_image.trim() !== '' && (
                  <figure>
                    <img
                      src={post.featured_image}
                      alt={post.title}
                      class="h-48 w-full object-cover"
                    />
                  </figure>
                )}
                <div class="card-body">
                  <h2 class="card-title">{post.title}</h2>
                  <p class="text-sm opacity-70">
                    {formatDate(post.published_at)}
                  </p>
                  <p class="mt-2">{post.excerpt || ''}</p>
                  {post.labels && post.labels.length > 0 && (
                    <div class="mt-3 card-actions justify-start">
                      {post.labels.map((tag) => (
                        <div class="badge-outline badge">{tag}</div>
                      ))}
                    </div>
                  )}
                  <div class="mt-4 card-actions justify-end">
                    <a href={`/blog/${post.id}`} class="btn btn-sm btn-primary">
                      阅读更多
                    </a>
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
