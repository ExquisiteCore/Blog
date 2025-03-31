import { BlogCard, BlogPost } from './blog-card';

interface BlogListProps {
  posts: BlogPost[];
  className?: string;
}

export function BlogList({ posts, className }: BlogListProps) {
  return (
    <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 ${className || ''}`}>
      {posts.map((post) => (
        <BlogCard key={post.id} post={post} />
      ))}
    </div>
  );
}