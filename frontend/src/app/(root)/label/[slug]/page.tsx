import React from 'react';
import { notFound } from 'next/navigation';
import { get } from '@/lib/http';
import { Label, Post } from '@/lib/types';
import { LabelDetail } from '@/components/label/label-detail';
import { UUID } from 'crypto';

export const revalidate = 60;

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

// 获取标签下的文章列表
async function getPostsByLabelId(labelId: string): Promise<Post[]> {
  try {
    return await get<Post[]>(`/labels/${labelId}/posts`, { withToken: false });
  } catch (error) {
    console.error(`获取标签(${labelId})下的文章失败:`, error);
    return [];
  }
}

export default async function Page({ params }: { params: Promise<{ slug: UUID }> }) {
  const { slug } = await params;
  const label = await getLabelBySlug(slug);

  if (!label) {
    notFound();
  }

  const posts = await getPostsByLabelId(label.id);

  return <LabelDetail label={label} posts={posts} />;
}