import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ExquisiteCore的博客",
  description: "记录我的生活和学习",
};

export default function RootLayout({ children }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="">
        {children}
      </body>
    </html>
  );
}
