'use client';

import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// 工具分类
const categories = [
  { id: "markdown", name: "markdown" },
  { id: "文档", name: "文档" },
];

// 工具列表
const tools = [
  {
    id: "markdown",
    name: "md编辑器",
    description: "一款基于React的Markdown编辑器，支持实时预览、导出、导入、复制、粘贴、撤销、重做、全屏、快捷键等功能。",
    category: "text",
    image: "/images/tools/md.png"
  }
];

export default function Page() {
  return (
    <div className="relative min-h-screen" style={{
      background: "linear-gradient(135deg, #f8dae9 0%, #e2f0fb 100%)"
    }}>
      <div className="container mx-auto px-4 py-8">
        {/* 标题 */}
        <h1 className="text-5xl font-bold mb-6 text-gray-800">ECTools</h1>

        {/* 分类标签 */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant="secondary"
              className="rounded-full text-sm bg-purple-100 text-purple-800 hover:bg-purple-200 border-none"
            >
              {category.name}
            </Button>
          ))}
        </div>

        {/* 介绍文本 */}
        <p className="text-lg mb-10 text-gray-600">
          我会在这个平台上分享我开发的一些小工具，当然，许多工具都是为了我个人能够使用方便而开发的。
        </p>

        {/* 工具卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map((tool) => (
            <Link href={`/ectools/${tool.id}`} key={tool.id}>
              <Card className="h-full cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 overflow-hidden border-0 bg-white/80">
                <div className="aspect-video w-full overflow-hidden rounded-t-xl">
                  <div className="relative h-full w-full">
                    <img
                      src={tool.image}
                      alt={tool.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center justify-center w-6 h-6 bg-purple-600 text-white rounded-md font-bold text-xs">
                      EC
                    </div>
                    <span className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs px-2 py-1 rounded-full">
                      {tool.category}
                    </span>
                  </div>
                  <CardTitle className="text-xl mb-2 mt-1">{tool.name}</CardTitle>
                  <CardDescription className="text-gray-600">{tool.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}