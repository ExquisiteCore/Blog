import { createResource, Show } from 'solid-js';
import http from '@/lib/axios';
import MarkdownRenderer from '@/components/solid/MarkdownRenderer';

// 定义文章接口
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

// 格式化日期函数
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// 获取单篇文章数据的函数
async function fetchPost(slug: string): Promise<Post | null> {
  try {
    const response = await http.get<Post>(`/posts/${slug}`, {
      withToken: false,
    });

    if (response && response.id) {
      return {
        ...response,
        featured_image: response.featured_image
          ? response.featured_image.replace(/`/g, '').trim()
          : null,
      };
    } else {
      console.error('API响应格式不符合预期:', response);
      return null;
    }
  } catch (error) {
    console.error(`获取文章 ${slug} 失败:`, error);
    return null;
  }
}

interface BlogPostProps {
  slug: string;
}

export default function BlogPost(props: BlogPostProps) {
  // 使用SolidJS的资源加载功能获取文章
  const [post] = createResource<Post | null>(() => fetchPost(props.slug));

  return (
    <div class="container mx-auto px-4 py-8">
      <Show
        when={!post.loading}
        fallback={
          <div class="py-12 text-center">
            <span class="loading loading-lg loading-spinner"></span>
          </div>
        }
      >
        <Show
          when={post()}
          fallback={
            <div class="py-12 text-center">
              <div class="mx-auto alert max-w-md alert-error shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6 shrink-0 stroke-current"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>文章不存在或已被删除</span>
              </div>
            </div>
          }
        >
          {post() && (
            <article class="prose-lg dark:prose-invert prose max-w-none">
              {post()!.featured_image && (
                <img
                  src={post()!.featured_image ?? ''}
                  alt={post()!.title}
                  class="mb-8 h-64 w-full rounded-lg object-cover shadow-md md:h-96"
                />
              )}

              <h1 class="mb-4 text-4xl font-bold">{post()!.title}</h1>

              <div class="mb-8 flex items-center text-sm opacity-70">
                <span>{formatDate(post()!.published_at)}</span>
                {post()!.labels && post()!.labels.length > 0 && (
                  <div class="ml-4 flex gap-2">
                    {post()!.labels.map((tag) => (
                      <div class="badge-outline badge">{tag}</div>
                    ))}
                  </div>
                )}
              </div>
              <MarkdownRenderer content={post()!.content} />
            </article>
          )}
        </Show>
      </Show>
    </div>
  );
}
