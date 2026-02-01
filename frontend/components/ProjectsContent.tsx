'use client';

import { useRef } from "react";
import Link from "next/link";

export default function ProjectsContent() {
  const modalRef = useRef<HTMLDialogElement>(null);

  const openModal = () => {
    modalRef.current?.showModal();
  };

  return (
    <>
      <div className="text-center my-8">
        <h1 className="text-4xl font-bold">我的项目</h1>
        <p className="mt-2 text-lg">这里展示了我的一些个人项目和作品</p>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 个人博客项目 */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  ></path>
                </svg>
                个人博客
              </h2>
              <p>
                基于现代技术栈构建的全栈个人博客系统，采用前后端分离架构设计。
              </p>

              <div className="mt-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="badge badge-primary">Astro</div>
                  <div className="badge badge-secondary">Rust</div>
                  <div className="badge badge-accent">PostgreSQL</div>
                  <div className="badge badge-ghost">Axum</div>
                  <div className="badge badge-info">TailwindCSS</div>
                  <div className="badge badge-success">Docker</div>
                </div>

                <div className="text-sm space-y-2">
                  <div>
                    <strong>前端：</strong> Astro + SolidJS + TypeScript +
                    TailwindCSS + DaisyUI
                  </div>
                  <div>
                    <strong>后端：</strong> Rust + Axum + Sqlx + PostgreSQL
                  </div>
                  <div>
                    <strong>部署：</strong> Docker + Docker Compose + Nginx
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-semibold mb-2">主要功能：</h4>
                <ul className="text-sm space-y-1">
                  <li>• 文章管理系统</li>
                  <li>• SEO 优化</li>
                  <li>• 响应式设计</li>
                  <li>• 全文搜索</li>
                  <li>• 项目展示</li>
                  <li>• 管理后台</li>
                </ul>
              </div>

              <div className="card-actions justify-end mt-6">
                <Link href="/" className="btn btn-primary btn-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    ></path>
                  </svg>
                  查看博客
                </Link>
                <a
                  href="https://github.com/ExquisiteCore/Blog"
                  target="_blank"
                  className="btn btn-outline btn-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    ></path>
                  </svg>
                  GitHub
                </a>
                <button className="btn btn-outline btn-sm" onClick={openModal}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  详细介绍
                </button>
              </div>
            </div>
          </div>

          {/* LagrangeGo-Template 项目 */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"
                  ></path>
                </svg>
                LagrangeGo-Template
                <div className="badge badge-success">维护中</div>
              </h2>
              <p>
                基于 LagrangeGo 的 QQ Bot
                开发模板，为开发者提供快速上手的项目框架。
              </p>

              <div className="mt-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="badge badge-primary">Go</div>
                  <div className="badge badge-secondary">Bot Framework</div>
                  <div className="badge badge-accent">Template</div>
                  <div className="badge badge-ghost">TOML</div>
                </div>

                <div className="text-sm space-y-2">
                  <div>
                    <strong>技术栈：</strong> Go + LagrangeGo + TOML + Logrus
                  </div>
                  <div>
                    <strong>协议：</strong> NTQQ PC Protocol
                  </div>
                  <div>
                    <strong>License：</strong> AGPL-3.0
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-semibold mb-2">主要特性：</h4>
                <ul className="text-sm space-y-1">
                  <li>• 账号密码 & 扫码登录</li>
                  <li>• 私聊/群聊消息处理</li>
                  <li>• 配置文件热重载</li>
                  <li>• 模块化逻辑注册</li>
                  <li>• 完整的日志系统</li>
                </ul>
              </div>

              <div className="flex justify-between items-center mt-6">
                <div className="card-actions">
                  <a
                    href="https://github.com/ExquisiteCore/LagrangeGo-Template"
                    target="_blank"
                    className="btn btn-primary btn-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      ></path>
                    </svg>
                    GitHub
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* LagrangeGo 开源贡献 */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  ></path>
                </svg>
                LagrangeGo
                <div className="badge badge-info">贡献者</div>
              </h2>
              <p>
                NTQQ PC 协议的 Go 语言实现，为 QQ 机器人开发提供核心协议支持。
              </p>

              <div className="mt-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="badge badge-primary">Go</div>
                  <div className="badge badge-secondary">Protocol</div>
                  <div className="badge badge-accent">NTQQ</div>
                  <div className="badge badge-ghost">Core Library</div>
                </div>

                <div className="text-sm space-y-2">
                  <div>
                    <strong>协议：</strong> NTQQ PC Protocol Implementation
                  </div>
                  <div>
                    <strong>用途：</strong> QQ Bot 开发核心库
                  </div>
                  <div>
                    <strong>贡献：</strong> 参与功能开发和问题修复
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-semibold mb-2">支持功能：</h4>
                <ul className="text-sm space-y-1">
                  <li>• 账号密码/二维码登录</li>
                  <li>• 文本/图片/语音/视频消息</li>
                  <li>• 群管理功能完整支持</li>
                  <li>• 好友/群消息事件处理</li>
                  <li>• 文件上传下载功能</li>
                </ul>
              </div>

              <div className="flex justify-between items-center mt-6">
                <div className="card-actions">
                  <a
                    href="https://github.com/LagrangeDev/LagrangeGo"
                    target="_blank"
                    className="btn btn-outline btn-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      ></path>
                    </svg>
                    GitHub
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* 占位项目卡片 */}
          <div className="card bg-base-100 shadow-xl opacity-50">
            <div className="card-body">
              <h2 className="card-title">更多项目</h2>
              <p>更多有趣的项目正在开发中...</p>
              <div className="card-actions justify-end">
                <div className="btn btn-disabled btn-sm">敬请期待</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 博客详情模态框 */}
      <dialog ref={modalRef} id="blog_details_modal" className="modal">
        <div className="modal-box max-w-4xl">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              ✕
            </button>
          </form>
          <h3 className="font-bold text-lg mb-4">个人博客 - 技术详情</h3>

          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-md mb-2">项目概述</h4>
              <p className="text-sm">
                这是一个采用现代技术栈构建的全栈个人博客系统，旨在提供优秀的用户体验和开发者体验。项目采用前后端分离架构，确保了良好的可维护性和扩展性。
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-md mb-2">技术架构</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-base-200 rounded-lg">
                  <h5 className="font-medium mb-2">前端技术栈</h5>
                  <ul className="text-sm space-y-1">
                    <li>
                      • <strong>Astro</strong> - 现代静态站点生成器
                    </li>
                    <li>
                      • <strong>SolidJS</strong> - 高性能响应式框架
                    </li>
                    <li>
                      • <strong>TypeScript</strong> - 类型安全
                    </li>
                    <li>
                      • <strong>TailwindCSS</strong> - 原子化CSS
                    </li>
                    <li>
                      • <strong>DaisyUI</strong> - 组件库
                    </li>
                  </ul>
                </div>
                <div className="p-4 bg-base-200 rounded-lg">
                  <h5 className="font-medium mb-2">后端技术栈</h5>
                  <ul className="text-sm space-y-1">
                    <li>
                      • <strong>Rust</strong> - 系统级编程语言
                    </li>
                    <li>
                      • <strong>Axum</strong> - 异步Web框架
                    </li>
                    <li>
                      • <strong>Sqlx</strong> - 类型安全的SQL工具包
                    </li>
                    <li>
                      • <strong>PostgreSQL</strong> - 关系型数据库
                    </li>
                    <li>
                      • <strong>Docker</strong> - 容器化部署
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-md mb-2">核心特性</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>• 响应式设计，完美适配各种设备</div>
                <div>• SEO优化，搜索引擎友好</div>
                <div>• 文章编辑与管理</div>
                <div>• 全文搜索功能</div>
                <div>• 项目作品展示</div>
                <div>• 管理后台系统</div>
                <div>• 暗色/亮色主题切换</div>
                <div>• 优化的加载性能</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-md mb-2">部署方案</h4>
              <p className="text-sm mb-2">
                项目支持多种部署方式，推荐使用Docker进行生产环境部署：
              </p>
              <div className="mockup-code text-xs">
                <pre>
                  <code>
                    {`# 一键启动所有服务
docker-compose up -d

# 包含前端、后端、数据库、Nginx反向代理`}
                  </code>
                </pre>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-md mb-2">未来规划</h4>
              <ul className="text-sm space-y-1">
                <li>• 评论系统</li>
                <li>• RSS订阅</li>
                <li>• 标签分类</li>
                <li>• 文章统计分析</li>
                <li>• API接口扩展</li>
              </ul>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
