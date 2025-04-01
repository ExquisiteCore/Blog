import { Post } from "@/lib/types";
import { Wrapper } from "@/components/wrapper";
import Image from "next/image";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

interface BlogDetailPageProps {
  blog: Post;
}

export function BlogDetailPage({ blog }: BlogDetailPageProps) {
  // 格式化日期
  const formatDate = (dateArray: number[]) => {
    if (!dateArray || dateArray.length < 3) return "";
    const date = new Date(dateArray[0], dateArray[1] - 1, dateArray[2]);
    return format(date, "yyyy年MM月dd日", { locale: zhCN });
  };

  return (
    <Wrapper className="flex min-h-screen flex-col px-6 pb-24 pt-8">
      <article className="mx-auto w-full max-w-3xl">
        <header className="mb-8">
          <h1 className="mb-4 text-3xl font-bold md:text-4xl">{blog.title}</h1>
          <div className="flex items-center text-sm text-muted-foreground">
            <time dateTime={blog.published_at?.toString()}>
              {formatDate(blog.published_at || blog.created_at)}
            </time>
          </div>
        </header>

        {blog.featured_image && (
          <div className="relative mb-8 h-64 w-full overflow-hidden rounded-lg sm:h-96">
            <Image
              src={blog.featured_image}
              alt={blog.title}
              fill
              priority
              className="object-cover"
            />
          </div>
        )}

        <div
          className="prose prose-lg max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />
      </article>
    </Wrapper>
  );
}