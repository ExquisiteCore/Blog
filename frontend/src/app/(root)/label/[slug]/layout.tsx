import * as React from "react";

import { type Metadata } from "next";
import { UUID } from "crypto";
import { get } from '@/lib/http';
import { Label } from '@/lib/types';

// 获取标签信息
async function getLabelBySlug(slug: UUID): Promise<Label | null> {
  try {
    const labels = await get<Label[]>('/labels', { withToken: false });
    return labels.find(label => label.id === slug) || null;
  } catch (error) {
    console.error(`获取标签(${slug})失败:`, error);
    return null;
  }
}

export async function generateMetadata(props: {
  params: Promise<{ slug: UUID }>;
}): Promise<Metadata> {
  try {
    const params = await props.params;
    const label = await getLabelBySlug(params.slug);

    return {
      title: `${label?.name || '未找到标签'} - EC`,
      description: label?.description || '探索更多相关内容',
    };
  } catch (error) {
    console.error('获取标签元数据失败:', error);
    return {
      title: '标签详情 - EC',
      description: '探索更多精彩内容',
    };
  }
}

export default function Layout({ children }: React.PropsWithChildren) {
  return <>{children}</>;
}