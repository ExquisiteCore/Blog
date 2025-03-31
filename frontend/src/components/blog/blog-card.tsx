import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { UUID } from 'crypto';

// 验证URL是否有效
function isValidUrl(url: string | undefined | null): boolean {
  if (!url) return false;

  try {
    new URL(url);
    return true;
  } catch (e) {
    console.error('Invalid image URL:', url, e);
    return false;
  }
}

export interface BlogPost {
  id: UUID;
  title: string;
  excerpt: string;
  featured_image: string;
  published_at: string;
  labels?: string[];
}

interface BlogCardProps {
  post: BlogPost;
  className?: string;
}

export function BlogCard({ post, className }: BlogCardProps) {
  return (
    <Link href={`/blog/${post.id}`} className="block">
      <div className={cn(
        'group overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md',
        className
      )}>
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={isValidUrl(post.featured_image) ? post.featured_image : 'https://ooo.0x0.ooo/2023/12/22/OKge71.webp'}
            alt={post.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
        </div>
        <div className="p-4">
          <h3 className="line-clamp-2 text-xl font-semibold">{post.title}</h3>
          <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{post.published_at}</span>
            {post.labels && post.labels.length > 0 && (
              <div className="flex gap-1">
                {post.labels.slice(0, 2).map((tag) => (
                  <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}