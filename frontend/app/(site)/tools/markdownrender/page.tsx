import { Metadata } from "next";
import MarkdownEditor from "@/components/MarkdownEditor";

export const metadata: Metadata = {
  title: "Markdown编辑器",
  description: "免费的在线Markdown编辑器，支持实时预览、语法高亮和导出功能",
  keywords: "Markdown编辑器,在线编辑器,MD编辑器,实时预览,文档编辑,写作工具",
};

export default function MarkdownRenderPage() {
  return (
    <div>
      <MarkdownEditor />
    </div>
  );
}
