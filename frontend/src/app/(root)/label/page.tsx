

import React from 'react';
import { get } from '@/lib/http';
import { Label } from '@/lib/types';
import { LabelCard } from '@/components/label/label-card';

async function getLabels(): Promise<Label[]> {
  try {
    return await get<Label[]>('/labels');
  } catch (error) {
    console.error('获取标签失败:', error);
    return [];
  }
}

export default async function Page() {
  const labels = await getLabels();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">标签列表</h1>

      {labels.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400">
          暂无标签
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {labels.map((label) => (
            <LabelCard key={label.id} label={label} />
          ))}
        </div>
      )}
    </div>
  );
}