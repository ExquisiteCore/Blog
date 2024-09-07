<template>
  <div class="flex min-h-full max-w-screen-md flex-col justify-center gap-5 px-6 md:px-10 2xl:max-w-7xl">
    <p class="animate-fade-up text-2xl tracking-widest animate-ease-in-out md:text-5xl"
      :style="{ animationDelay: `${animationDelays.p1}ms` }">
      你好，我是
    </p>

    <strong :class="cn(
      `text-5xl md:text-7xl tracking-widest font-black  bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500`,
      'animate-fade-up animate-ease-in-out'
    )" :style="{
      WebkitTextFillColor: 'transparent',
      animationDelay: `${animationDelays.strong}ms`
    }">
      ExquisiteCore
    </strong>

    <div :class="cn('animate-fade-up animate-ease-in-out')"
      :style="{ animationDelay: `${animationDelays.typeIntro}ms` }">
      <TypeIntro />
    </div>

    <p :class="cn(
      'text-2xl md:text-5xl tracking-widest',
      'animate-fade-up animate-ease-in-out'
    )" :style="{ animationDelay: `${animationDelays.p2}ms` }">
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
    )" :style="{ animationDelay: `${animationDelays.p3}ms` }">
      欢迎来到我的个人网站，这里记录了一些关于我的技术之路、生活之道、感悟之事。
    </p>

    <div :class="cn('flex space-x-4', 'animate-fade-up animate-ease-in-out')"
      :style="{ animationDelay: `${animationDelays.buttons}ms` }">
      <NuxtLink to="/blog">
        <el-button class="w-15 h-15">我的博客</el-button>
      </NuxtLink>
      <NuxtLink to="/about">
        <el-button class="w-15 h-15">关于我</el-button>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

// 定义初始延迟值
const baseDelay = 200

// 响应式变量用于跟踪当前的延迟值
const delay = ref(0)

// 计算属性用于获取不同元素的动画延迟
const animationDelays = computed(() => {
  // 延迟值
  delay.value += baseDelay
  return {
    p1: delay.value,
    strong: delay.value + baseDelay,
    typeIntro: delay.value + baseDelay * 2,
    p2: delay.value + baseDelay * 3,
    p3: delay.value + baseDelay * 4,
    buttons: delay.value + baseDelay * 5
  }
})

</script>
