<template>
  <header :class="cn(
    'w-full sticky top-0 backdrop-blur transition-[background-color,border-width] border-x-0 flex justify-center z-10',
    (scrollTop > 60) && 'bg-background/50 border-b border-border/50'
  )">
    <div class="flex h-16 w-full items-center p-4 sm:p-8 md:max-w-screen-md 2xl:max-w-screen-xl">

      <NuxtLink to="/" :class="cn('mr-4 hidden sm:flex')" aria-label="EC">
        <p class="font-bold text-2xl">EC</p>
        <span class="ml-2 text-base font-semibold text-primary">
          精致的芯
        </span>
      </NuxtLink>
      <div class="mr-8 hidden h-16 flex-1 items-center justify-end text-base font-medium sm:flex">
        <NuxtLink v-for="el in navItems" :key="el.link" :to="el.link" :class="cn(
          'font-normal text-sm text-muted-foreground transition-colors px-4 py-2',
          'hover:font-semibold hover:text-primary',
          pathname === el.link && 'font-semibold text-primary'
        )">
          {{ el.label }}
        </NuxtLink>
      </div>
      <div class="flex flex-1 items-center justify-end gap-2 sm:flex-none">
        <NuxtLink to="https://github.com/exquisitecore/" target="_blank" title="https://github.com/exquisitecore/"
          aria-label="https://github.com/exquisitecore/">
          <el-button class="w-15 h-15" round>github</el-button>
        </NuxtLink>

      </div>

    </div>
  </header>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// 获取当前路径
const route = useRoute();
const pathname = route.path;

// 创建 scrollTop 状态
const scrollTop = ref(0);

// 监听页面滚动
const handleScroll = () => {
  scrollTop.value = window.scrollY;
};

// 在组件挂载时监听滚动事件
onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

// 在组件卸载时移除监听
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});


const navItems = [
  { label: '首页', link: '/' },
  { label: '博客', link: '/blog' },
  { label: '关于', link: '/about' }
];

</script>