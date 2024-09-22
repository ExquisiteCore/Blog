// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: {
    enabled: true
  },
  css: [
    '~/assets/css/main.css',
    'md-editor-v3/lib/style.css'
  ],
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
    'radix-vue/nuxt',
    '@pinia/nuxt',
    '@pinia-plugin-persistedstate/nuxt',
    '@nuxtjs/sitemap',
    'shadcn-nuxt',
    'radix-vue/nuxt'
  ],
  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: './components/ui'
  },
  app: {
    head: {
      meta: [
        { name: 'baidu-site-verification', content: 'codeva-bFd8DjRxnG' }
      ]
    }
  },
  runtimeConfig: {
    public: {
      api: 'https://blogserver.exquisitecore.xyz'
    }
  },
})
