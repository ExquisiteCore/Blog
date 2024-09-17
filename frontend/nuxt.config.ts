// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css', 'md-editor-v3/lib/style.css'],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  typescript: {
    shim: false
  },
  modules: [
    '@nuxt/image',
    '@element-plus/nuxt',
    'radix-vue/nuxt',
    '@pinia/nuxt',
    '@pinia-plugin-persistedstate/nuxt',
    '@nuxtjs/sitemap'
  ],
  elementPlus: {},
app: {
  head: {
    meta: [name='baidu-site-verification', content='codeva-bFd8DjRxnG']
}}
})