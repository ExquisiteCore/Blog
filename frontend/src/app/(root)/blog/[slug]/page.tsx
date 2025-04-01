import { getBlogBySlug } from "@/components/blog/blog-slug";
import { BlogDetailPage } from "@/components/blog/blog-detail";
import { UUID } from "crypto";
import { notFound } from "next/navigation";

export const revalidate = 60;

export default async function Page(props: {
  params: Promise<{ slug: UUID }>;
}) {
  const params = await props.params;
  const blog = await getBlogBySlug(params.slug);

  if (!blog) {
    notFound();
  }

  return <BlogDetailPage blog={blog} />;
}
