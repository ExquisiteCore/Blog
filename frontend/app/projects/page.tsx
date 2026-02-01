import { Metadata } from "next";
import ProjectsContent from "@/components/ProjectsContent";

export const metadata: Metadata = {
  title: "我的项目",
  description:
    "ExquisiteCore的个人项目展示，包括全栈博客系统、QQ Bot开发模板等开源项目。使用Rust、Go、TypeScript等技术栈。",
  keywords:
    "ExquisiteCore项目,开源项目,全栈开发,Rust,Go,TypeScript,QQ Bot,LagrangeGo,个人博客",
  openGraph: {
    title: "我的项目 | ExquisiteCore",
    description:
      "ExquisiteCore的个人项目展示，包括全栈博客系统、QQ Bot开发模板等开源项目。",
    type: "website",
  },
};

export default function ProjectsPage() {
  return <ProjectsContent />;
}
