'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const tools = [
  {
    id: 'markdownrender',
    name: 'md编辑器',
    description:
      '一款基于Rust编写Wasm的Markdown编辑器，支持实时预览、导出、导入、复制、粘贴、撤销、重做、全屏、快捷键等功能。',
    category: ['text', 'markdown'],
    image: '/markdown-svgrepo-com.svg',
    type: 'editor',
  },
  {
    id: 'noveldesigner',
    name: '小说设计器',
    description:
      '专为小说创作者打造的工具，支持角色管理、大纲编辑、世界观设定、灵感笔记等功能，让你的创作更有条理。',
    category: ['creative', 'writing'],
    image: '/book.webp',
    type: 'creative',
  },
];

export default function ToolList() {
  const searchParams = useSearchParams();

  const filteredTools = useMemo(() => {
    const selectedCategory = searchParams.get('category') || 'all';
    return selectedCategory === 'all'
      ? tools
      : tools.filter((tool) => tool.type === selectedCategory);
  }, [searchParams]);

  return (
    <>
      {filteredTools.length > 0 ? (
        filteredTools.map((tool) => (
          <Link
            key={tool.id}
            href={`/tools/${tool.id}`}
            className="card dark:border-base-700 dark:bg-base-800 h-full cursor-pointer overflow-hidden border border-base-200 bg-base-100 transition-all hover:-translate-y-1 hover:scale-[1.02] hover:shadow-lg"
          >
            <figure className="aspect-video w-full overflow-hidden">
              <img
                src={tool.image}
                alt={tool.name}
                className="h-full w-full object-cover transition-transform hover:scale-105"
                loading="lazy"
              />
            </figure>
            <div className="card-body p-5">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-content">
                  EC
                </div>
                <div className="flex flex-wrap gap-1">
                  {Array.isArray(tool.category) ? (
                    tool.category.map((cat) => (
                      <span
                        key={cat}
                        className="badge badge-outline badge-primary badge-sm rounded-full px-2 py-1 text-xs"
                      >
                        {cat}
                      </span>
                    ))
                  ) : (
                    <span className="badge badge-outline badge-primary badge-sm rounded-full px-2 py-1 text-xs">
                      {tool.category}
                    </span>
                  )}
                </div>
              </div>
              <h2 className="card-title mt-1 mb-2 text-xl">{tool.name}</h2>
              <p className="text-base-content/80">{tool.description}</p>
            </div>
          </Link>
        ))
      ) : (
        <div className="col-span-1 py-16 text-center md:col-span-2 lg:col-span-3">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="text-5xl">🔍</div>
            <h3 className="text-2xl font-bold">没有找到相关工具</h3>
            <p className="text-base-content/70">
              请尝试选择其他分类或返回查看全部工具
            </p>
            <Link href="/tools" className="btn btn-primary mt-4">
              查看全部工具
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
