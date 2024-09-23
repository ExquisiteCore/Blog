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
      title: 'EC的小站',
      meta: [
        { charset: 'utf-8' },
        { name: 'baidu-site-verification', content: 'codeva-bFd8DjRxnG' },
        { hid: 'description', name: 'description', content: 'EC的小站' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },
  site: {
    url: 'https://exquisitecore.xyz'
  },
  sitemap: {
    xsl: false,
    defaults: {
      changefreq: 'daily',
      priority: 0.8
    }
  },
  runtimeConfig: {
    public: {
      api: 'https://blogserver.exquisitecore.xyz'
    }
  },
})
