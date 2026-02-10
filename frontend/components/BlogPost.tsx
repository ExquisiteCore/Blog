'use client';

import MarkdownRenderer from './MarkdownRenderer';
import type { PostDetail } from '@/types/api';

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

interface BlogPostProps {
  post: PostDetail;
}

export default function BlogPost({ post }: BlogPostProps) {
  const coverImage = post.cover_images && post.cover_images.length > 0 ? post.cover_images[0] : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <article className="prose prose-lg dark:prose-invert max-w-none">
        {coverImage && (
          <img
            src={coverImage}
            alt={post.title}
            className="w-full h-64 md:h-96 rounded-lg object-cover shadow-md mb-8"
          />
        )}

        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

        <div className="flex items-center text-sm opacity-70 mb-8">
          {post.published_at && <span>{formatDate(post.published_at)}</span>}
          {post.labels && post.labels.length > 0 && (
            <div className="flex gap-2 ml-4">
              {post.labels.map((tag) => (
                <div key={tag} className="badge badge-outline">
                  {tag}
                </div>
              ))}
            </div>
          )}
        </div>

        <MarkdownRenderer content={post.content} />
      </article>
    </div>
  );
}
