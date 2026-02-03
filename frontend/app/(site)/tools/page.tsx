import { Metadata } from "next";
import { Suspense } from "react";
import ToolList from "@/components/ToolList";

export const metadata: Metadata = {
  title: "工具箱",
  description: "ExquisiteCore 的在线工具箱，提供各种实用的开发和创作工具",
};

export default function ToolsPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-4 text-center">精致的工具箱</h1>
      <p className="text-center text-base-content/70 mb-12 max-w-2xl mx-auto">
        这里提供各种在线工具，帮助你提升工作效率和创作体验
      </p>

      {/* 工具网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Suspense
          fallback={
            <div className="col-span-full py-12 text-center">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          }
        >
          <ToolList />
        </Suspense>
      </div>
    </div>
  );
}
