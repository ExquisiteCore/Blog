// SEO工具函数

/**
 * 生成页面标题
 * @param title 页面标题
 * @param siteName 站点名称
 * @returns 完整的页面标题
 */
export function generateTitle(title?: string, siteName = "ExquisiteCore"): string {
  if (!title) return siteName;
  return title.includes(siteName) ? title : `${title} | ${siteName}`;
}

/**
 * 生成页面描述
 * @param description 页面描述
 * @param maxLength 最大长度
 * @returns 截断后的描述
 */
export function generateDescription(description: string, maxLength = 160): string {
  if (description.length <= maxLength) return description;
  return description.substring(0, maxLength - 3) + "...";
}

/**
 * 生成关键词字符串
 * @param keywords 关键词数组或字符串
 * @returns 关键词字符串
 */
export function generateKeywords(keywords: string[] | string): string {
  if (Array.isArray(keywords)) {
    return keywords.join(", ");
  }
  return keywords;
}

/**
 * 生成Open Graph图片URL
 * @param image 图片路径或URL
 * @param baseUrl 基础URL
 * @returns 完整的图片URL
 */
export function generateImageUrl(image?: string, baseUrl = "https://blog.exquisitecore.xyz"): string {
  if (!image) return `${baseUrl}/logo.svg`;
  if (image.startsWith("http")) return image;
  return `${baseUrl}${image.startsWith("/") ? "" : "/"}${image}`;
}

/**
 * 生成结构化数据
 * @param type 内容类型
 * @param data 数据对象
 * @returns 结构化数据对象
 */
export function generateStructuredData(type: "website" | "article" | "person" | "organization", data: any) {
  const baseData = {
    "@context": "https://schema.org",
    "@type": type === "article" ? "BlogPosting" : type === "website" ? "WebSite" : type,
    "name": data.title || data.name,
    "description": data.description,
    "url": data.url,
    "image": data.image
  };

  switch (type) {
    case "article":
      return {
        ...baseData,
        "headline": data.title,
        "author": {
          "@type": "Person",
          "name": data.author || "ExquisiteCore",
          "url": "https://blog.exquisitecore.xyz"
        },
        "publisher": {
          "@type": "Organization",
          "name": "ExquisiteCore Blog",
          "logo": {
            "@type": "ImageObject",
            "url": "https://blog.exquisitecore.xyz/logo.svg"
          }
        },
        "datePublished": data.publishedTime,
        "dateModified": data.modifiedTime || data.publishedTime,
        "articleSection": data.section,
        "keywords": data.keywords
      };

    case "website":
      return {
        ...baseData,
        "publisher": {
          "@type": "Organization",
          "name": "ExquisiteCore Blog"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://blog.exquisitecore.xyz/search?q={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        }
      };

    default:
      return baseData;
  }
}

/**
 * 验证SEO数据
 * @param data SEO数据对象
 * @returns 验证结果
 */
export function validateSEOData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.title || data.title.length < 10 || data.title.length > 60) {
    errors.push("标题应该在10-60个字符之间");
  }

  if (!data.description || data.description.length < 50 || data.description.length > 160) {
    errors.push("描述应该在50-160个字符之间");
  }

  if (!data.keywords || (Array.isArray(data.keywords) && data.keywords.length === 0)) {
    errors.push("应该提供关键词");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}