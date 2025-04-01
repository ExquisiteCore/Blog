import * as React from "react";

import { type Metadata } from "next";
import { getBlogBySlug } from "@/components/blog/blog-slug";

import { UUID } from "crypto";


export async function generateMetadata(props: {
  params: Promise<{ slug: UUID }>;
}): Promise<Metadata> {
  try {
    const params = await props.params;
    const post = await getBlogBySlug(params.slug);

    return {
      title: `${post?.title || '未找到文章'} - EC`,
      description: post?.excerpt || post?.content?.slice(0, 50),
    };
  } catch (error) {
    console.error('获取文章元数据失败:', error);
    return {
      title: '文章详情 - EC',
      description: '探索更多精彩内容',
    };
  }
}

export default function Layout({ children }: React.PropsWithChildren) {
  return <>{children}</>;
}
