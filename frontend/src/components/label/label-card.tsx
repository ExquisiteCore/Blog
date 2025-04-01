import React from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Label } from '@/lib/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// 标签颜色列表
const labelColors = [
  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
];

// 根据标签ID生成一致的颜色索引
function getColorIndexFromId(id: string): number {
  // 使用ID的第一个字符的ASCII码作为哈希值
  const hashValue = id.charCodeAt(0);
  return hashValue % labelColors.length;
}

interface LabelCardProps {
  label: Label;
  className?: string;
}

export function LabelCard({ label, className }: LabelCardProps) {
  // 根据标签ID选择颜色
  const colorIndex = getColorIndexFromId(label.id);
  const colorClass = labelColors[colorIndex];

  return (
    <Link href={`/label/${label.id}`}>
      <Card
        className={cn(
          'cursor-pointer transition-all hover:shadow-md hover:-translate-y-1 py-3 px-2 max-w-[150px] mx-auto',
          colorClass,
          className
        )}
      >
        <CardContent className="flex items-center justify-center p-2">
          <CardTitle className="text-center text-base font-bold">
            {label.name}
          </CardTitle>
        </CardContent>
      </Card>
    </Link>
  );
}