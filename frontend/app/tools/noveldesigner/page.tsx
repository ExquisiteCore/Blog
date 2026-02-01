import { Metadata } from "next";
import Link from "next/link";
import NovelDesigner from "@/components/NovelDesigner";

export const metadata: Metadata = {
  title: "小说设计器",
  description: "专为小说创作者打造的工具，支持角色管理、大纲编辑、世界观设定、灵感笔记等功能",
  keywords: "小说设计器,小说创作工具,角色管理,大纲编辑,世界观设定,灵感笔记,写作工具",
};

export default function NovelDesignerPage() {
  return (
    <div className="relative min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link href="/tools" className="btn btn-ghost btn-sm gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            返回工具列表
          </Link>
        </div>

        {/* 标题 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3">小说设计器</h1>
          <p className="text-lg opacity-80">
            专为小说创作者打造的工具，让你的创作更有条理
          </p>
        </div>

        {/* 小说设计器组件 */}
        <NovelDesigner />
      </div>
    </div>
  );
}
