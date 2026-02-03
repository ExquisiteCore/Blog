import Header from "@/components/Header";
import Footer from "@/components/Footer";

// JSON-LD 结构化数据
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ExquisiteCore - 个人博客",
  headline: "ExquisiteCore - 个人博客",
  description: "ExquisiteCore的个人博客，分享全栈开发、游戏开发和技术思考。探索有趣的项目和创新想法。",
  url: "https://blog.exquisitecore.xyz",
  image: "https://blog.exquisitecore.xyz/logo.svg",
  author: {
    "@type": "Person",
    name: "ExquisiteCore",
    url: "https://blog.exquisitecore.xyz",
  },
  publisher: {
    "@type": "Organization",
    name: "ExquisiteCore Blog",
    logo: {
      "@type": "ImageObject",
      url: "https://blog.exquisitecore.xyz/logo.svg",
    },
  },
};

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="flex flex-col min-h-screen">
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
      </div>
    </>
  );
}
