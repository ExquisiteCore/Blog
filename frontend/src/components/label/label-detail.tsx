import React from 'react';
import { Wrapper } from '@/components/wrapper';
import { Label, Post } from '@/lib/types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

interface LabelDetailProps {
  label: Label;
  posts: Post[];
}

// 按年份和月份分组文章
function groupPostsByYearAndMonth(posts: Post[]) {
  const groupedPosts: Record<number, Record<number, Post[]>> = {};

  posts.forEach(post => {
    const publishedDate = post.published_at || post.created_at;
    if (!publishedDate) return;

    let year: number;
    let month: number;

    if (typeof publishedDate === 'string') {
      // 处理ISO格式的日期字符串
      const date = new Date(publishedDate);
      year = date.getFullYear();
      month = date.getMonth() + 1; // JavaScript月份从0开始，需要+1
    } else if (Array.isArray(publishedDate) && publishedDate.length >= 2) {
      // 处理数组格式的日期
      year = publishedDate[0];
      // 修复异常月份值问题：如果月份值大于12，则取模获取实际月份
      month = publishedDate[1] > 12 ? (publishedDate[1] % 12 || 12) : publishedDate[1];
    } else {
      return;
    }

    if (!groupedPosts[year]) {
      groupedPosts[year] = {};
    }

    if (!groupedPosts[year][month]) {
      groupedPosts[year][month] = [];
    }

    groupedPosts[year][month].push(post);
  });

  // 按年份降序排序
  return Object.entries(groupedPosts)
    .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
    .map(([year, months]) => ({
      year: Number(year),
      months: Object.entries(months)
        .sort(([monthA], [monthB]) => Number(monthB) - Number(monthA))
        .map(([month, posts]) => ({
          month: Number(month),
          posts,
        })),
    }));
}

// 格式化日期
function formatDate(dateValue: number[] | string) {
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

export function LabelDetail({ label, posts }: LabelDetailProps) {
  const groupedPosts = groupPostsByYearAndMonth(posts);

  return (
    <Wrapper className="flex min-h-screen flex-col px-6 pb-24 pt-8">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-8">
          <h1 className="mb-4 text-3xl font-bold md:text-4xl text-center">{label.name}</h1>
          {label.description && (
            <p className="text-center text-muted-foreground mb-4">{label.description}</p>
          )}
          <div className="text-center text-sm text-muted-foreground">
            共计 {posts.length} 篇文章
          </div>
        </header>

        {posts.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400">
            暂无文章
          </div>
        ) : (
          <div className="space-y-10">
            {groupedPosts.map(({ year, months }) => (
              <div key={year} className="space-y-6">
                <h2 className="text-2xl font-bold">{year}</h2>
                {months.map(({ month, posts }) => (
                  <div key={`${year}-${month}`} className="space-y-4">
                    <h3 className="text-xl font-semibold">{month}月</h3>
                    <div className="space-y-3">
                      {posts.map((post) => (
                        <Card key={post.id} className="hover:bg-accent/50 transition-colors">
                          <CardContent className="p-4">
                            <Link href={`/blog/${post.id}`} className="block">
                              <div className="flex justify-between items-center">
                                <h4 className="font-medium">{post.title}</h4>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(post.published_at || post.created_at)}
                                </span>
                              </div>
                            </Link>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </Wrapper>
  );
}