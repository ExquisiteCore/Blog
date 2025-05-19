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

  site: "https://blog.exquisitecore.xzy",
  integrations: [solidJs({ devtools: true }), sitemap()],
  output: "server",
  adapter: node({
    mode: "standalone",
  }),
});
