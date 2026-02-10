import Link from 'next/link';
import type { PostSummary } from '@/types/api';

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

interface BlogPostsProps {
  posts: PostSummary[];
}

export default function BlogPosts({ posts }: BlogPostsProps) {
  if (posts.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="text-base-content/60">
          <p className="text-xl mb-2">暂无文章</p>
          <p>敬请期待...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/blog/${post.id}`}
          className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
        >
          {post.cover_images && post.cover_images.length > 0 && (
            <figure>
              <img
                src={post.cover_images[0]}
                alt={post.title}
                className="w-full h-48 object-cover"
                loading="lazy"
              />
            </figure>
          )}
          <div className="card-body">
            <h2 className="card-title line-clamp-2">{post.title}</h2>
            {post.summary && (
              <p className="text-base-content/70 line-clamp-3">{post.summary}</p>
            )}
            <div className="flex items-center justify-between mt-4">
              {post.published_at && (
                <span className="text-sm text-base-content/60">
                  {formatDate(post.published_at)}
                </span>
              )}
              {post.labels && post.labels.length > 0 && (
                <div className="flex gap-1">
                  {post.labels.slice(0, 2).map((label) => (
                    <span key={label} className="badge badge-outline badge-sm">
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
