'use client';

export function MainPage() {

  return (
    <div
      className="w-full py-16"
    >
      <div className="w-full px-6 md:px-10 py-16 bg-gradient-to-b from-[#1a1a1a] to-[#363636]">
        <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-[#6fba82] via-[#3b82f6] to-[#9333ea] bg-clip-text text-transparent">
          我的技术栈
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-background/50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4 text-primary">🌐</div>
            <h3 className="text-xl font-semibold mb-2">前端开发</h3>
            <p className="text-muted-foreground">
              精通React、Vue、Next.js等现代前端框架，构建响应式、高性能的用户界面。
            </p>
          </div>

          <div className="bg-background/50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4 text-primary">⚙️</div>
            <h3 className="text-xl font-semibold mb-2">后端开发</h3>
            <p className="text-muted-foreground">
              熟悉Node.js、Rust、Go等后端技术，开发高效、安全的服务端应用。
            </p>
          </div>

          <div className="bg-background/50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4 text-primary">🔐</div>
            <h3 className="text-xl font-semibold mb-2">系统架构</h3>
            <p className="text-muted-foreground">
              设计可扩展的系统架构，优化性能，确保系统稳定性和安全性。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}