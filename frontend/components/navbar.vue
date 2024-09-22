<template>
  <header :class="cn(
    'w-full sticky top-0 backdrop-blur transition-[background-color,border-width] border-x-0 flex justify-center z-10',
    scrollTop > 60 ? 'bg-background/50 border-b border-border/50' : ''
  )">
    <div class="flex h-16 w-full items-center p-4 sm:p-8 md:max-w-screen-md 2xl:max-w-screen-xl">

      <NuxtLink to="/" :class="cn('mr-4 hidden sm:flex')" aria-label=" EC">
        <p class="font-bold text-2xl">EC</p>
        <span class="ml-2 text-base font-semibold text-primary">
          精致的芯
        </span>
      </NuxtLink>
      <div class="mr-8 hidden h-16 flex-1 items-center justify-end text-base font-medium sm:flex">
        <NuxtLink v-for="el in navItems" :key="el.link" :to="el.link" :class="cn(
          'font-normal text-sm text-muted-foreground transition-colors px-4 py-2',
          'hover:font-semibold hover:text-primary',
          route.path === el.link && 'font-semibold text-primary'
        )">
          {{ el.label }}
        </NuxtLink>
      </div>
      <div class="flex flex-1 items-center justify-end gap-2 sm:flex-none">

        <NuxtLink to="https://github.com/exquisitecore/" target="_blank" title="https://github.com/exquisitecore/"
          aria-label="https://github.com/exquisitecore/">
          <Button variant="outline" size="icon">
            <GithubLogoIcon class="w-4 h-4" />
          </Button>
        </NuxtLink>

        <nuxt-link :to="isLoggedIn ? '/about' : '/signin'" rel="nofollow" title="登录" aria-label="登录">
          <Button variant="outline" class="w-9 h-9" aria-label="登录">
            <span v-if="!isLoggedIn">未登录</span>
            <span v-if="isLoggedIn">{{ username }}</span>
          </Button>
        </nuxt-link>
      </div>

    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button'
import { GithubLogoIcon } from '@radix-icons/vue'

const scrollTop = ref(0)
const route = useRoute()

const userStore = useUserStore()
const isLoggedIn = ref(userStore.isLoggedIn)
const username = ref(userStore.getUsername())

// 监听 isLoggedIn 和 username 的变化
watch(() => userStore.isLoggedIn, (newValue) => {
  isLoggedIn.value = newValue
})

watch(() => userStore.getUsername(), (newValue) => {
  username.value = newValue
})

const navItems = [
  { label: '首页', link: '/' },
  { label: '博客', link: '/blog' },
  { label: '关于', link: '/about' },
  { label: '工具箱', link: '/toolbox' },
];

onMounted(() => {
  window.addEventListener('scroll', () => {
    scrollTop.value = window.scrollY
  })
})
</script>