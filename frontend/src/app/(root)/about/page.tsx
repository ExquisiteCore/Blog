'use client';

import * as React from 'react';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { IconBrandGithub } from '@/components/icons/githubicon';
import { Clock } from '@/components/clock';

export default function Page() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6 min-h-[calc(100vh-64px)]">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* 标题部分 */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">你好，我是 ExquisiteCore 👋</h1>
        </div>

        {/* 个人信息部分 */}
        <div className="bg-card p-6 rounded-lg shadow-sm">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-4">关于我</h2>
              <ul className="space-y-3 list-disc list-inside">
                <li>一名热爱开源的中国学生</li>
                <li>动漫爱好者</li>
                <li>喜欢生电但不精通的Minecraft玩家</li>
                <li className="flex flex-wrap items-center">
                  <span className="mr-2">喜欢的编程语言</span>
                  <div className="flex flex-wrap gap-2">
                    <img src="https://img.shields.io/badge/-Csharp-purple?style=flat-square&logo=Csharp&logoColor=fff" alt="C#" />
                    <img src="https://img.shields.io/badge/-C++-blue?style=flat-square&logo=c%2B%2B&logoColor=fff" alt="C++" />
                    <img src="https://img.shields.io/badge/-Rust-tan?style=flat-square&logo=Rust&logoColor=fff" alt="Rust" />
                  </div>
                </li>
                <li className="flex flex-wrap items-center">
                  <span className="mr-2">我的系统</span>
                  <div className="flex flex-wrap gap-2">
                    <img src="https://img.shields.io/badge/-windows-blue?style=flat-square&logo=windows&logoColor=fff" alt="Windows" />
                    <img src="https://img.shields.io/badge/-ubuntu-orange?style=flat-square&logo=ubuntu&logoColor=fff" alt="Ubuntu" />
                  </div>
                </li>
              </ul>
              <p className="mt-4">喜欢写一些简单的代码和一些好玩的小东西</p>
            </div>
            <div className="md:ml-8 mt-6 md:mt-0 flex justify-center">
              <Clock />
            </div>
          </div>
        </div>

        {/* 爱好部分 */}
        <div className="bg-card p-6 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">我的爱好</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 list-disc list-inside">
            <li>喜欢尝试各种新鲜事物和折腾</li>
            <li>动漫and二刺螈</li>
            <li>水群</li>
            <li>来点Music</li>
            <li>美味的东西</li>
            <li>打游戏</li>
            <li>喜欢计算机，目前主要是C#，C++和Rust。进一步的东西还在学习中。。。</li>
            <li>刷机(才不是大变活砖)</li>
            <li>目前正在写一些好玩的项目(鸽子)，快来给我点star</li>
          </ul>
        </div>

        {/* GitHub链接 */}
        <div className="flex justify-center mt-8">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant="outline" size="lg" className="gap-2">
                  <Link href="https://github.com/ExquisiteCore" target="_blank" rel="noopener noreferrer">
                    <IconBrandGithub className="w-5 h-5" />
                    <span>访问我的GitHub</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>去看看我的开源项目吧！</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}