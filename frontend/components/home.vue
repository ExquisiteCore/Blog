<template>
  <div class="flex min-h-full max-w-screen-md flex-col justify-center gap-5 px-6 md:px-10 2xl:max-w-7xl">
    <p class="animate-fade-up text-2xl tracking-widest animate-ease-in-out md:text-5xl"
      :style="{ animationDelay: `${getDelay()}ms` }">
      你好，我是
    </p>

    <strong :class="[
      'text-5xl md:text-7xl tracking-widest font-black bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500',
      'animate-fade-up animate-ease-in-out'
    ]" :style="{
      WebkitTextFillColor: 'transparent',
      animationDelay: `${getDelay()}ms`
    }">
      ExquisiteCore
    </strong>

    <div :class="['animate-fade-up animate-ease-in-out']" :style="{ animationDelay: `${getDelay()}ms` }">
      <TypeIntro />
    </div>

    <p :class="[
      'text-2xl md:text-5xl tracking-widest',
      'animate-fade-up animate-ease-in-out'
    ]" :style="{ animationDelay: `${getDelay()}ms` }">
      喜欢
      <span class="font-semibold text-[#f44c7c]">C++</span>、
      <span class="font-semibold text-[#dca484]">Rust</span>和
      <span class="font-semibold text-[#148404]">.NET</span>、
      <span class="font-semibold text-[#00d8ff]">Golang</span>
      <span class="ml-4">\qwq/ ~</span>
    </p>
    <p :class="[
      'text-base md:text-2xl text-muted-foreground tracking-widest',
      'animate-fade-up animate-ease-in-out'
    ]" :style="{ animationDelay: `${getDelay()}ms` }">
      欢迎来到我的个人网站
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

let delay = ref(0)

const getDelay = () => {
  delay.value += 200
  return delay.value
}
</script>
