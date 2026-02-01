import { Metadata } from "next";

export const metadata: Metadata = {
  title: "关于我 | ExquisiteCore - 全栈开发者的个人介绍",
  description:
    "了解ExquisiteCore - 一名热爱编程的中国学生，全栈开发者和业余游戏开发者。分享我的技术背景、兴趣爱好和博客创建的故事。",
  keywords:
    "关于ExquisiteCore,个人介绍,全栈开发者,学生程序员,C#,C++,Rust,开源爱好者,动漫,Minecraft",
};

export default function AboutPage() {
  return (
    <div className="container mx-auto">
      {/* Page Header */}
      <div className="text-center my-8">
        <h1 className="text-4xl font-bold">关于我</h1>
        <p className="mt-2 text-lg">了解更多关于我的信息和博客背后的故事</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 my-12">
        {/* Left Column - Story */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">你好，我是 ExquisiteCore 👋</h2>
          <p>
            欢迎来到我的博客！我是一名热爱开源的中国学生，同时也是一位动漫爱好者和Minecraft玩家（喜欢生电但不太精通）。
          </p>
          <p>
            我喜欢编程，特别是C#、C++和Rust这些语言。喜欢写一些简单的代码和好玩的小东西，不断探索计算机世界的新可能性。
          </p>
          <p>
            我使用的系统包括Windows和macOS，喜欢折腾各种新鲜事物，包括刷机（当然不是大变活砖）。
          </p>

          <h2 className="text-2xl font-bold mt-8">我的爱好</h2>
          <p>除了编程，我还有很多其他的兴趣爱好：</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>喜欢尝试各种新鲜事物和折腾</li>
            <li>动漫and二刺螈</li>
            <li>水群</li>
            <li>来点Music</li>
            <li>享受美味的食物</li>
            <li>打游戏</li>
            <li>目前正在写一些好玩的项目，欢迎给我点star</li>
          </ul>
        </div>

        {/* Right Column - Image and Stats */}
        <div>
          <div className="card bg-base-100 shadow-xl">
            <figure>
              <img
                src="https://streak-stats.demolab.com/?user=ExquisiteCore&theme=rose&hide_border=true&locale=zh_Hans&card_width=648"
                alt="Team Image"
                className="w-full h-auto"
              />
            </figure>
            <div className="card-body">
              <h3 className="card-title">访客计数</h3>
              <p>
                这是我记录技术探索、分享学习心得的个人空间。欢迎访问我的博客！
              </p>
              <div className="mt-4">
                <img
                  src="https://moe-counter.glitch.me/get/@exquisitecore?theme=meborru"
                  alt="访客计数"
                  className="mx-auto"
                />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="stats shadow w-full mt-8">
            <div className="stat">
              <div className="stat-figure text-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="inline-block w-8 h-8 stroke-current"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  ></path>
                </svg>
              </div>
              <div className="stat-title">喜欢的语言</div>
              <div className="stat-value text-primary">
                <div className="flex space-x-1">
                  <img
                    src="https://img.shields.io/badge/-Csharp-purple?style=flat-square&logo=Csharp&logoColor=fff"
                    alt="C#"
                  />
                  <img
                    src="https://img.shields.io/badge/-C++-blue?style=flat-square&logo=c%2B%2B&logoColor=fff"
                    alt="C++"
                  />
                  <img
                    src="https://img.shields.io/badge/-Rust-tan?style=flat-square&logo=Rust&logoColor=fff"
                    alt="Rust"
                  />
                </div>
              </div>
              <div className="stat-desc">不断学习中</div>
            </div>

            <div className="stat">
              <div className="stat-figure text-secondary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="inline-block w-8 h-8 stroke-current"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  ></path>
                </svg>
              </div>
              <div className="stat-title">使用的系统</div>
              <div className="stat-value text-secondary">
                <div className="flex space-x-1">
                  <img
                    src="https://img.shields.io/badge/-windows-blue?style=flat-square&logo=windows&logoColor=fff"
                    alt="Windows"
                  />
                  <img
                    src="https://img.shields.io/badge/-macos-silver?style=flat-square&logo=apple&logoColor=fff"
                    alt="macOS"
                  />
                </div>
              </div>
              <div className="stat-desc">喜欢折腾各种系统</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
