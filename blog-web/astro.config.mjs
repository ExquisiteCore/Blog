// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

import solidJs from "@astrojs/solid-js";

import sitemap from "@astrojs/sitemap";

import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },

  site: "https://blog.exquisitecore.xyz",
  integrations: [
    solidJs({ devtools: true }),
    sitemap({
      // 自定义sitemap配置
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      // 排除某些页面（如果需要）
      filter: (page) => !page.includes('/admin'),
      // 自定义URL
      customPages: [
        'https://blog.exquisitecore.xyz/tools',
        'https://blog.exquisitecore.xyz/tools/markdownrender'
      ]
    })
  ],
  output: "static",
  adapter: node({
    mode: "standalone",
  }),
  // SEO相关配置
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto'
  }
});
