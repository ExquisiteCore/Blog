<template>
  <div class="flex min-h-full max-w-screen-md flex-col justify-center gap-5 px-6 md:px-10 2xl:max-w-7xl">
    <p class="animate-fade-up text-2xl tracking-widest animate-ease-in-out md:text-5xl"
      :style="{ animationDelay: `${getDelay()}ms` }">
      你好，我是
    </p>

    <strong :class="cn(
      `text-5xl md:text-7xl tracking-widest font-black  bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500`,
      'animate-fade-up animate-ease-in-out'
    )" :style="{
      WebkitTextFillColor: 'transparent',
      animationDelay: `${getDelay()}ms`
    }">
      ExquisiteCore
    </strong>

    <div :class="cn('animate-fade-up animate-ease-in-out')" :style="{ animationDelay: `${getDelay()}ms` }">
      <TypeIntro />
    </div>

    <p :class="cn(
      'text-2xl md:text-5xl tracking-widest',
      'animate-fade-up animate-ease-in-out'
    )" :style="{ animationDelay: `${getDelay()}ms` }">
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
    )" :style="{ animationDelay: `${getDelay()}ms` }">
      欢迎来到我的个人网站，这里记录了一些关于我的技术之路、生活之道、感悟之事。
    </p>

    <div :class="cn('flex space-x-4', 'animate-fade-up animate-ease-in-out')"
      :style="{ animationDelay: `${getDelay()}ms` }">
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
import { ref } from 'vue'

//import { cn } from "~/utils/cn"

let delay = ref(0)
const getDelay = () => {
  delay.value += 200
  return delay.value
}
</script>