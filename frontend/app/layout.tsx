import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "ExquisiteCore - 个人博客",
    template: "%s | ExquisiteCore",
  },
  description: "ExquisiteCore的个人博客，分享全栈开发、游戏开发和技术思考。探索有趣的项目和创新想法。",
  keywords: "ExquisiteCore,个人博客,全栈开发,游戏开发,技术博客,编程,开发者",
  authors: [{ name: "ExquisiteCore" }],
  creator: "ExquisiteCore",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "ExquisiteCore Blog",
    title: "ExquisiteCore - 个人博客",
    description: "ExquisiteCore的个人博客，分享全栈开发、游戏开发和技术思考。",
    images: ["https://blog.exquisitecore.xyz/logo.svg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "ExquisiteCore - 个人博客",
    description: "ExquisiteCore的个人博客，分享全栈开发、游戏开发和技术思考。",
    creator: "@ExquisiteCore",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.svg",
  },
};

// 主题初始化脚本
const themeScript = `
  try {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
    }
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "light");
  }
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex flex-col min-h-screen">
        <img
          src="/background.svg"
          alt=""
          className="fixed inset-0 w-full h-full -z-10 blur-[100px]"
        />
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-8 flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
