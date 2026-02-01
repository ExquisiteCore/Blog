import { Metadata } from "next";
import BlogPosts from "@/components/BlogPosts";

export const metadata: Metadata = {
  title: "博客",
  description: "ExquisiteCore的技术博客，分享全栈开发、游戏开发和技术思考",
};

export default function BlogPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-4 text-center">博客</h1>
      <p className="text-center text-base-content/70 mb-12 max-w-2xl mx-auto">
        这里是我的技术博客，分享全栈开发、游戏开发和各种有趣的技术探索
      </p>
      <BlogPosts />
    </div>
  );
}
