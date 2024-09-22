<template>
  <div class="flex min-h-full max-w-screen-md flex-col justify-center gap-5 px-6 md:px-10 2xl:max-w-7xl">
    <p class="animate-fade-up text-2xl tracking-widest animate-ease-in-out md:text-5xl"
      :style="{ animationDelay: animationDelays.p1 }">
      你好，我是
    </p>

    <strong :class="cn(
      `text-5xl md:text-8xl tracking-widest font-black  bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500`,
      'animate-fade-up animate-ease-in-out'
    )" :style="{
      WebkitTextFillColor: 'transparent',
      animationDelay: animationDelays.strong
    }">
      精致的芯
    </strong>

    <div v-if="isMounted" :class="cn('animate-fade-up animate-ease-in-out')"
      :style="{ animationDelay: animationDelays.typeIntro }">
      <TypeIntro />
    </div>

    <p :class="cn(
      'text-2xl md:text-5xl tracking-widest',
      'animate-fade-up animate-ease-in-out'
    )" :style="{ animationDelay: animationDelays.p2 }">
      喜欢
      <span class="font-semibold text-[#f44c7c]">C++</span>、
      <span class="font-semibold text-[#dca484]">Rust</span>和
      <span class="font-semibold text-[#148404]">.NET</span>、
      <span class="font-semibold text-[#00d8ff]">Golang</span>
      <span class="ml-4">\qwq/ ~</span>
    </p>

    <p :class="cn(
      'text-base md:text-2xl text-muted-foreground tracking-widest',
      'animate-fade-up animate-ease-in-out',
    )" :style="{ animationDelay: animationDelays.p3 }">
      欢迎来到我的个人网站，这里记录了一些关于我的技术之路、生活之道、感悟之事。
    </p>

    <div v-if="isMounted" :class="cn('flex space-x-4', 'animate-fade-up animate-ease-in-out')"
      :style="{ animationDelay: animationDelays.buttons }">
      <NuxtLink to="/blog">
        <Button variant="outline">我的博客</Button>
      </NuxtLink>
      <NuxtLink to="/about">
        <Button variant="outline">关于我</Button>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const baseDelay = 200
const delay = ref(baseDelay * 5) // 初始化 delay 值
const isMounted = ref(false)

onMounted(() => {
  isMounted.value = true
})

const animationDelays = computed(() => ({
  p1: `${delay.value}ms`,
  strong: `${delay.value + baseDelay}ms`,
  typeIntro: `${delay.value + baseDelay * 2}ms`,
  p2: `${delay.value + baseDelay * 3}ms`,
  p3: `${delay.value + baseDelay * 4}ms`,
  buttons: `${delay.value + baseDelay * 5}ms`
}))
</script>
