import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { UUID } from 'crypto';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

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

// 格式化日期
function formatDate(dateValue: number[] | string | undefined): string {
  if (!dateValue) return "";

  let date: Date;

  if (typeof dateValue === 'string') {
    // 处理ISO格式的日期字符串
    date = new Date(dateValue);
  } else if (Array.isArray(dateValue) && dateValue.length >= 3) {
    // 处理数组格式的日期 [年, 月, 日]
    // 注意：JavaScript的月份是从0开始的（0=一月），而后端传来的数组是从1开始
    // 修复异常月份值问题：如果月份值大于12，则取模获取实际月份
    const year = dateValue[0];
    const month = dateValue[1] > 12 ? (dateValue[1] % 12 || 12) - 1 : dateValue[1] - 1;
    const day = dateValue[2];
    date = new Date(year, month, day);
  } else {
    return "";
  }

  return format(date, "yyyy年MM月dd日", { locale: zhCN });
}

export interface BlogPost {
  id: UUID;
  title: string;
  excerpt: string;
  featured_image: string;
  published_at: number[] | string;
  created_at: number[] | string;
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
            <span className="text-xs text-muted-foreground">{formatDate(post.published_at || post.created_at)}</span>
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